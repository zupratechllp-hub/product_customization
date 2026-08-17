import frappe
import google.generativeai as genai

def get_model():
    api_key = frappe.conf.get("gemini_api_key")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name="gemini-3.5-flash",
        system_instruction=(
            "You are an assistant for ZupraTech ERP. Only answer questions "
            "about using this ERP system or the user's own data. "
            "If asked anything unrelated, respond exactly: "
            "'I can only help with questions about ZupraTech.' "
            "Reply in plain conversational text only. Do not use Markdown formatting "
            "such as #, ##, ###, ---, **bold**, or bullet symbols. Use plain numbered "
            "steps like '1.', '2.' and write in normal sentences and paragraphs."
        )
    )

HELP_DOCS = [
    {"topic": "Create Sales Order", "content": "Go to Selling > Sales Order > New. Fill in Customer, Item, Quantity, Rate. Click Save then Submit."},
    {"topic": "Create Purchase Order", "content": "Go to Buying > Purchase Order > New. Select Supplier, add items, save and submit."},
    {"topic": "Create Customer", "content": "Go to Selling > Customer > New. Enter Customer Name and details, then Save."},
]

def get_relevant_docs(message):
    words = message.lower().split()
    matches = [d for d in HELP_DOCS if any(w in d["content"].lower() for w in words)]
    return matches if matches else HELP_DOCS[:2]

import re

def clean_markdown(text):
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^-{3,}\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

@frappe.whitelist()
def ask(question, route=None, page_title=None, sidebar_items=None):
    question = str(question or "").strip()

    if not question:
        return {"answer": "Please ask a question about ZupraTech."}

    try:
        docs = get_relevant_docs(question)
        context_text = "\n".join(d["content"] for d in docs)
        prompt = f"CONTEXT:\n{context_text}\n\nQUESTION:\n{question}"

        model = get_model()

        response = None
        last_error = None
        for _ in range(2):
            try:
                response = model.generate_content(prompt, request_options={"timeout": 20})
                break
            except Exception as e:
                last_error = e
        if response is None:
            raise last_error

        return {"answer": clean_markdown(response.text)}
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Ask Zupra Gemini")
        return {"answer": "I could not process that question right now. Please try again."}
