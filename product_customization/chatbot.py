import json
import frappe
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from product_customization import ask_zupra


def get_model():
    api_key = frappe.conf.get("gemini_api_key")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name="gemini-3.5-flash-lite",
        system_instruction=(
            "You are an assistant for ZupraTech ERP, which is built on the Frappe/ERPNext "
            "platform. If the user greets you (e.g. hi, hello, hey), reply warmly and briefly, "
            "e.g. 'Hello! How can I help you with ZupraTech today?' "
            "Answer any question about using this ERP system, including standard ERPNext "
            "features and doctypes such as Sales Order, Purchase Order, Journal Entry, "
            "Payment Entry, Quotation, Customer, Item, Invoice, and any other ERP module or "
            "workflow, even if it is not explicitly listed in the provided context. Use your "
            "general knowledge of how ERPNext works to give accurate, practical steps. "
            "Only refuse if the question is clearly unrelated to ERP or business software "
            "usage (e.g. weather, general trivia, entertainment). In that case respond exactly: "
            "'I can only help with questions about ZupraTech.' "
            "Reply in plain conversational text. Do not use Markdown headers (#, ##, ###), "
            "horizontal rules (---), or bullet symbols. Use plain numbered steps like '1.', '2.' "
            "and write in normal sentences and paragraphs. You may use **bold** (double asterisks) "
            "around short headings or key terms, such as **Creating a Sales Order** at the start "
            "of an answer, or around field names like **Customer** or **Item**, to help the "
            "reader scan the answer quickly."
        )
    )

HELP_DOCS = [
    {"topic": "Create Sales Order", "content": "Go to Selling > Sales Order > New. Fill in Customer, Item, Quantity, Rate. Click Save then Submit."},
    {"topic": "Create Purchase Order", "content": "Go to Buying > Purchase Order > New. Select Supplier, add items, save and submit."},
    {"topic": "Create Customer", "content": "Go to Selling > Customer > New. Enter Customer Name and details, then Save."},
    {"topic": "Create Quotation", "content": "Go to Selling > Quotation > New. Select the Customer or Lead, add Items, Quantity, and Rate. Click Save then Submit."},
    {"topic": "Create Credit Note", "content": "In ZupraTech ERP, a Credit Note is created as a Sales Invoice with Is Return checked. Go to Accounts > Sales Invoice > New, check the Is Return checkbox, select the original invoice as Return Against, and Save then Submit."},
    {"topic": "Create Debit Note", "content": "In ZupraTech ERP, a Debit Note is created as a Purchase Invoice with Is Return checked. Go to Accounts > Purchase Invoice > New, check the Is Return checkbox, select the original invoice as Return Against, and Save then Submit."},
]

def get_relevant_docs(message):
    words = message.lower().split()
    matches = [d for d in HELP_DOCS if any(w in d["content"].lower() for w in words)]
    return matches


import re

def clean_markdown(text):
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^-{3,}\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def _is_max_min_question(text):
    text = text.lower()
    max_words = ["maximum", "highest", "most", "greatest", "top", "largest", "biggest"]
    min_words = ["minimum", "lowest", "least", "smallest"]
    return any(w in text for w in max_words) or any(w in text for w in min_words)


def _resolve_sort_field(doctype, text):
    meta = frappe.get_meta(doctype)
    text_l = text.lower()
    numeric_fields = {
        df.fieldname: (df.label or df.fieldname).lower()
        for df in meta.fields
        if df.fieldtype in ("Currency", "Float", "Int", "Percent")
    }

    qualifier_words = {
        "discount", "tax", "freight", "advance", "paid", "outstanding",
        "rounded", "rate", "quantity", "qty", "weight", "net",
    }
    has_qualifier = any(q in text_l for q in qualifier_words)

    if not has_qualifier:
        common_totals = (
            "grand_total", "base_grand_total", "total", "base_total",
            "net_total", "base_net_total", "total_amount", "base_total_amount",
            "amount", "paid_amount", "outstanding_amount",
            "total_debit", "total_credit", "difference_amount",
        )
        for candidate in common_totals:
            if candidate in numeric_fields:
                return candidate
        for fieldname in numeric_fields:
            if "total" in fieldname:
                return fieldname
        for fieldname in numeric_fields:
            if "amount" in fieldname:
                return fieldname

    best_field = None
    best_score = 0
    for fieldname, label in numeric_fields.items():
        label_words = set(label.replace("_", " ").split())
        score = sum(1 for w in label_words if w in text_l)
        if score > best_score:
            best_score = score
            best_field = fieldname
    return best_field


def _max_min_query_answer(doctype, text):
    field = _resolve_sort_field(doctype, text)
    if not field:
        return None
    min_words = ["minimum", "lowest", "least", "smallest"]
    is_min = any(w in text.lower() for w in min_words)
    order = "asc" if is_min else "desc"
    rows = frappe.get_all(doctype, fields=["name", field], order_by=f"{field} {order}", limit_page_length=1)
    if not rows:
        return None
    row = rows[0]
    try:
        doc = frappe.get_doc(doctype, row["name"])
    except Exception:
        doc = None
    title_val = None
    for attr in ("customer_name", "customer", "party_name", "supplier_name", "supplier", "title"):
        if doc is not None:
            val = getattr(doc, attr, None)
            if val:
                title_val = val
                break
    label = field.replace("_", " ").title()
    which = "lowest" if is_min else "highest"
    if title_val:
        return f"The {doctype} with the {which} {label} is {row['name']}, for {title_val}, with {label} of {row[field]}."
    return f"The {doctype} with the {which} {label} is {row['name']}, with {label} of {row[field]}."


DOCTYPE_ALIASES = {
    "sale order": "Sales Order",
    "sales order": "Sales Order",
    "purchase order": "Purchase Order",
    "sale invoice": "Sales Invoice",
    "purchase invoice": "Purchase Invoice",
}


def _resolve_doctype_with_aliases(question, page_title, route, sidebar_items):
    text_lower = question.lower()
    for phrase, doctype in DOCTYPE_ALIASES.items():
        if phrase in text_lower:
            return doctype
    try:
        return ask_zupra._resolve_doctype(question, page_title, route, sidebar_items)
    except Exception:
        return None


def _try_live_data_answer(question, route, page_title, sidebar_items):
    text_lower = question.lower()
    doctype = _resolve_doctype_with_aliases(question, page_title, route, sidebar_items)

    if doctype and _is_max_min_question(text_lower):
        try:
            answer = _max_min_query_answer(doctype, question)
            if answer:
                return answer
        except Exception:
            pass

    try:
        if ask_zupra._is_workflow_question(text_lower):
            return None
        result = ask_zupra.ask(question, route, page_title, sidebar_items)
        answer = result.get("answer", "") if isinstance(result, dict) else ""
    except Exception:
        return None

    fallback_markers = [
        "I can answer only from live ZupraTech site data",
        "I could not match that question to a readable live DocType",
        "I could not complete the live data lookup",
    ]
    if any(marker in answer for marker in fallback_markers):
        return None
    return answer


HISTORY_CACHE_KEY = "ask_zupra_shared_history"
HISTORY_LIMIT = 5


def _get_history():
    raw = frappe.cache().get_value(HISTORY_CACHE_KEY)
    if not raw:
        return []
    try:
        return json.loads(raw)
    except Exception:
        return []


def _save_to_history(question, answer):
    history = _get_history()
    history.insert(0, {"question": question, "answer": answer})
    history = history[:HISTORY_LIMIT]
    frappe.cache().set_value(HISTORY_CACHE_KEY, json.dumps(history))


@frappe.whitelist()
def get_history():
    return _get_history()


@frappe.whitelist()
def ask(question, route=None, page_title=None, sidebar_items=None):
    question = str(question or "").strip()

    if not question:
        return {"answer": "Please ask a question about ZupraTech."}

    try:
        live_answer = _try_live_data_answer(question, route, page_title, sidebar_items)
        if live_answer:
            _save_to_history(question, live_answer)
            return {"answer": live_answer}
    except Exception:
        pass

    try:
        docs = get_relevant_docs(question)
        context_text = "\n".join(d["content"] for d in docs)
        if context_text:
            prompt = f"CONTEXT (may be helpful, use if relevant):\n{context_text}\n\nQUESTION:\n{question}"
        else:
            prompt = f"QUESTION:\n{question}\n\nNo specific context was found for this question. Answer using your general knowledge of how ERPNext works."

        model = get_model()

        response = None
        last_error = None
        for _ in range(2):
            try:
                response = model.generate_content(
                    prompt,
                    generation_config={"max_output_tokens": 500},
                    request_options={"timeout": 25},
                )
                break
            except Exception as e:
                last_error = e
        if response is None:
            raise last_error

        try:
            answer_text = clean_markdown(response.text)
        except Exception:
            answer_text = "I generated a partial answer that got cut off. Please ask again, perhaps more specifically."

        _save_to_history(question, answer_text)
        return {"answer": answer_text}
    except ResourceExhausted:
        frappe.log_error(frappe.get_traceback(), "Ask Zupra Gemini")
        return {"answer": "You have reached today's usage limit for Ask Zupra. Please try again tomorrow."}
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Ask Zupra Gemini")
        return {"answer": "I could not process that question right now. Please try again."}
