import re

import frappe
from frappe.utils import add_days, get_first_day, getdate, nowdate


STANDARD_FIELDS = {
	"name": "ID",
	"owner": "Created By",
	"creation": "Created On",
	"modified": "Last Modified",
	"docstatus": "Document Status",
}

IGNORED_FIELD_TYPES = {
	"Button",
	"Column Break",
	"Fold",
	"HTML",
	"Image",
	"Section Break",
	"Tab Break",
	"Table",
	"Table MultiSelect",
}

SITE_WORDS = {
	"desk",
	"doctype",
	"erp",
	"erpnext",
	"module",
	"page",
	"record",
	"screen",
	"site",
	"website",
	"workflow",
	"zupra",
	"zupratech",
}

PREFERRED_SAMPLE_DOCTYPES = (
	"Customer",
	"Supplier",
	"Item",
	"Lead",
	"Opportunity",
	"Quotation",
	"Sales Order",
	"Delivery Note",
	"Sales Invoice",
	"Purchase Order",
	"Purchase Invoice",
	"Payment Entry",
	"Project",
	"Task",
	"Employee",
)

INTERNAL_SAMPLE_DOCTYPES = {
	"DocField",
	"DocPerm",
	"DocType",
	"Has Role",
	"Patch Log",
	"Property Setter",
	"Scheduled Job Log",
	"Version",
}

INTERNAL_SAMPLE_PREFIXES = (
	"Custom DocPerm",
	"DocType ",
	"Payment Reconciliation ",
	"Recorder",
	"RQ ",
	"System Health Report",
)


@frappe.whitelist()
def ask(question, route=None, page_title=None, sidebar_items=None):
	question = str(question or "").strip()
	text = _normalize(question)

	if not text:
		return {"answer": "Please ask a question about the live ZupraTech site data."}

	try:
		if _is_greeting(text):
			return {"answer": _live_intro_answer()}

		if _is_general_site_help_question(text) or _is_site_inventory_question(text):
			return {
				"answer": _site_help_answer(
					page_title=page_title,
					sidebar_items=sidebar_items,
					include_samples=_is_site_inventory_question(text),
				)
			}

		doctype = _resolve_doctype(text, page_title, route, sidebar_items)

		if _is_current_page_question(text):
			return {"answer": _current_page_answer(page_title, route, sidebar_items, doctype)}

		if _is_site_help_question(text) or _is_site_inventory_question(text):
			return {"answer": _site_help_answer(doctype, page_title, sidebar_items)}

		if not doctype:
			return {"answer": _unmatched_answer(text, page_title, sidebar_items)}

		if not _can_read(doctype):
			return {"answer": f"I found {doctype}, but your user does not have read access to its live records."}

		group_field, requested_group = _resolve_group_field(doctype, text)
		if group_field:
			return {"answer": _group_count_answer(doctype, group_field, text)}

		if requested_group:
			return {"answer": _missing_group_field_answer(doctype, requested_group)}

		if _is_status_question(text):
			return {"answer": _status_answer(doctype, text)}

		if _is_permission_question(text):
			return {"answer": _permission_answer(doctype, text)}

		if _is_route_question(text):
			return {"answer": _route_answer(doctype)}

		if _is_field_question(doctype, text):
			return {"answer": _field_answer(doctype, text)}

		if _is_workflow_question(text):
			return {"answer": _workflow_answer(doctype, text)}

		if _is_count_question(text):
			return {"answer": _count_answer(doctype, text)}

		if _is_latest_question(text):
			return {"answer": _latest_answer(doctype, text)}

		if _is_definition_question(text):
			return {"answer": _doctype_overview_answer(doctype)}

		return {"answer": _live_summary_answer(doctype, text)}
	except Exception:
		frappe.log_error(frappe.get_traceback(), "Ask Zupra")
		return {"answer": "I could not complete the live data lookup. Please refresh the desk and ask again."}


@frappe.whitelist()
def get_current_user_name():
	if frappe.session.user == "Guest":
		return {}

	user = frappe.db.get_value(
		"User",
		frappe.session.user,
		["first_name", "last_name", "full_name"],
		as_dict=True,
	) or {}

	return {
		"first_name": user.get("first_name"),
		"last_name": user.get("last_name"),
		"full_name": user.get("full_name"),
	}


def _normalize(value):
	return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def _tokenize(value):
	return [token for token in _normalize(value).split() if token]


def _contains_phrase(text, phrase):
	phrase = _normalize(phrase)
	return bool(phrase and re.search(rf"\b{re.escape(phrase)}\b", text))


def _singularize(word):
	if word.endswith("ies") and len(word) > 3:
		return f"{word[:-3]}y"
	if word.endswith("ses") and len(word) > 3:
		return word[:-2]
	if word.endswith("s") and len(word) > 2:
		return word[:-1]
	return word


def _pluralize(word):
	if word.endswith("y") and len(word) > 1:
		return f"{word[:-1]}ies"
	if word.endswith("s"):
		return word
	return f"{word}s"


def _phrase_variants(value):
	phrase = _normalize(value)
	if not phrase:
		return set()

	words = phrase.split()
	variants = {phrase}

	if len(words) == 1:
		variants.add(_singularize(words[0]))
		variants.add(_pluralize(words[0]))
	else:
		last_word = words[-1]
		variants.add(" ".join([*words[:-1], _singularize(last_word)]))
		variants.add(" ".join([*words[:-1], _pluralize(last_word)]))
		variants.add(last_word)
		variants.add(_singularize(last_word))
		variants.add(_pluralize(last_word))

	return {variant for variant in variants if variant}


def _full_phrase_variants(value):
	phrase = _normalize(value)
	if not phrase:
		return set()

	words = phrase.split()
	variants = {phrase}

	if words:
		variants.add(" ".join([*words[:-1], _pluralize(words[-1])]))
		variants.add(" ".join([*words[:-1], _singularize(words[-1])]))

	return {variant for variant in variants if variant}


def _readable_doctypes():
	if getattr(frappe.local, "_ask_zupra_readable_doctypes", None) is not None:
		return frappe.local._ask_zupra_readable_doctypes

	doctypes = frappe.get_all("DocType", filters={"issingle": 0}, fields=["name", "istable"])
	readable = []

	for row in doctypes:
		doctype = row.get("name")
		if row.get("istable"):
			continue
		if doctype.startswith("DocType ") or doctype.startswith("Custom DocPerm"):
			continue
		if _can_read(doctype):
			readable.append(doctype)

	frappe.local._ask_zupra_readable_doctypes = readable
	return readable


def _can_read(doctype):
	try:
		return bool(frappe.has_permission(doctype, "read"))
	except Exception:
		return False


def _resolve_doctype(text, page_title=None, route=None, sidebar_items=None):
	context_text = _normalize(f"{page_title or ''} {route or ''} {sidebar_items or ''}")
	subject_text = _question_subject_text(text)
	best_doctype = None
	best_score = 0

	for doctype in _readable_doctypes():
		score = 0
		doctype_phrase = _normalize(doctype)
		variants = _phrase_variants(doctype)
		full_variants = _full_phrase_variants(doctype)

		for variant in variants:
			if subject_text and _contains_phrase(subject_text, variant):
				score += 12 + len(variant.split())
				if variant in full_variants:
					score += 20

			if _contains_phrase(text, variant):
				score += 6 + len(variant.split())
				if variant in full_variants:
					score += 12
			if variant and variant in context_text:
				score += 2

		if doctype_phrase and doctype_phrase in _normalize(route):
			score += 8

		if doctype_phrase and doctype_phrase == _normalize(page_title):
			score += 8

		if score > best_score:
			best_doctype = doctype
			best_score = score

	return best_doctype if best_score else None


def _question_subject_text(text):
	patterns = (
		r"\bhow many ([a-z0-9 ]+?)(?: are | is | were | was | created| available| by |$)",
		r"\bnumber of ([a-z0-9 ]+?)(?: created| available| by |$)",
		r"\bcount of ([a-z0-9 ]+?)(?: created| available| by |$)",
		r"\btotal ([a-z0-9 ]+?)(?: created| available| by |$)",
		r"\blatest ([a-z0-9 ]+?)(?: created| available| by |$)",
		r"\brecent ([a-z0-9 ]+?)(?: created| available| by |$)",
		r"\blist ([a-z0-9 ]+?)(?: created| available| by |$)",
		r"\bshow ([a-z0-9 ]+?)(?: created| available| by |$)",
	)

	for pattern in patterns:
		match = re.search(pattern, text)
		if not match:
			continue

		return _clean_subject(match.group(1))

	return _clean_subject(text.split(" by ")[0])


def _clean_subject(value):
	words = [
		word
		for word in _tokenize(value)
		if word
		not in {
			"all",
			"are",
			"created",
			"is",
			"me",
			"record",
			"records",
			"tell",
			"the",
			"was",
			"were",
		}
	]
	return " ".join(words)


def _resolve_group_field(doctype, text):
	requested = _requested_group_phrase(text)

	if not requested:
		return None, None

	fields = _field_candidates(doctype)
	best_field = None
	best_score = 0

	for field in fields:
		aliases = _phrase_variants(field["fieldname"]) | _phrase_variants(field["label"])
		score = 0

		for alias in aliases:
			if alias == requested:
				score += 8
			elif " " in requested and (_contains_phrase(requested, alias) or _contains_phrase(alias, requested)):
				score += 4
			elif len(alias.split()) > 1 and _contains_phrase(text, alias):
				score += 1

		if score > best_score:
			best_field = field["fieldname"]
			best_score = score

	return best_field, requested


def _requested_group_phrase(text):
	patterns = (
		r"\bgroup(?:ed)? by ([a-z0-9 ]+)$",
		r"\bbreak(?:down)? by ([a-z0-9 ]+)$",
		r"\bcount by ([a-z0-9 ]+)$",
		r"\bnumber of [a-z0-9 ]+ by ([a-z0-9 ]+)$",
		r"\bhow many [a-z0-9 ]+ by ([a-z0-9 ]+)$",
		r"\bper ([a-z0-9 ]+)$",
		r"\bby ([a-z0-9 ]+)$",
	)

	for pattern in patterns:
		match = re.search(pattern, text)
		if match:
			return _normalize(match.group(1))

	wise_match = re.search(r"\b([a-z0-9]+) wise\b", text)
	if wise_match:
		return _normalize(wise_match.group(1))

	return None


def _field_candidates(doctype):
	meta = frappe.get_meta(doctype)
	fields = [
		{"fieldname": fieldname, "label": label}
		for fieldname, label in STANDARD_FIELDS.items()
	]

	for field in meta.fields:
		if field.fieldtype in IGNORED_FIELD_TYPES or not field.fieldname:
			continue

		fields.append(
			{
				"fieldname": field.fieldname,
				"label": field.label or field.fieldname,
				"fieldtype": field.fieldtype,
			}
		)

	return fields


def _has_field(doctype, fieldname):
	return fieldname in STANDARD_FIELDS or bool(frappe.get_meta(doctype).has_field(fieldname))


def _is_greeting(text):
	return (
		re.match(r"^(?:h+i+|hello+|hey+|namaste|good morning|good afternoon|good evening)\b", text)
		is not None
	)


def _is_current_page_question(text):
	return any(
		phrase in text
		for phrase in (
			"this page",
			"current page",
			"where am i",
			"what page",
			"what is here",
			"what can i do here",
			"how to use this",
		)
	)


def _is_site_help_question(text):
	return any(
		phrase in text
		for phrase in (
			"help",
			"what can you do",
			"what can i ask",
			"how can you help",
			"ask zupra",
		)
	)


def _is_general_site_help_question(text):
	return text in {
		"help",
		"what can you do",
		"what can i ask",
		"how can you help",
		"ask zupra",
	}


def _is_site_inventory_question(text):
	return bool(
		re.search(r"\b(?:what|which|show|list)\b", text)
		and re.search(r"\b(?:doctypes?|documents?|modules?|areas?|data)\b", text)
		and re.search(r"\b(?:available|read|access|site|zupra|erp|erpnext)\b", text)
	)


def _is_workflow_question(text):
	workflow_action = r"(?:create|add|make|raise|prepare|enter|open|use|view|edit|submit)"

	return bool(
		re.search(rf"\bhow (?:to|do i|can i|should i) {workflow_action}\b", text)
		or (
			re.search(r"\b(?:steps?|process|procedure|guide)\b", text)
			and re.search(rf"\b{workflow_action}\b", text)
		)
		or _is_create_question(text)
	)


def _is_create_question(text):
	return any(
		re.search(rf"\b{verb}\b", text)
		for verb in ("create", "add", "make", "raise", "prepare", "enter")
	)


def _is_status_question(text):
	return bool(
		re.search(r"\b(?:status|docstatus)\b", text)
		and not _is_field_keyword_question(text)
		and not _is_workflow_question(text)
	)


def _is_permission_question(text):
	if "how can i" in text or "how do i" in text:
		return False

	return bool(
		re.search(r"\b(?:permission|access|allowed|allow|can i|am i able|am i allowed|do i have access)\b", text)
	)


def _is_route_question(text):
	return bool(
		re.search(r"\b(?:where|route|link|menu|navigate|navigation|find|open)\b", text)
		and not _is_workflow_question(text)
		and not _is_latest_question(text)
	)


def _is_field_question(doctype, text):
	return _is_field_keyword_question(text) or bool(
		_resolve_schema_field(doctype, text) and _is_specific_field_question(text)
	)


def _is_field_keyword_question(text):
	return bool(
		re.search(r"\b(?:fields?|columns?|schema|mandatory|required|details?|information|value|values)\b", text)
	)


def _is_definition_question(text):
	return bool(
		re.search(r"\b(?:what is|what are|explain|describe|overview|tell me about|meaning of|purpose of)\b", text)
	)


def _is_count_question(text):
	return any(
		phrase in text
		for phrase in (
			"available",
			"count",
			"created",
			"how many",
			"number of",
			"total",
		)
	)


def _is_latest_question(text):
	return any(phrase in text for phrase in ("last", "latest", "list", "recent", "show"))


def _base_filters(doctype, text):
	filters = []

	if "today" in text:
		filters.append(["creation", ">=", nowdate()])
	elif "yesterday" in text:
		today = getdate(nowdate())
		filters.append(["creation", ">=", add_days(today, -1)])
		filters.append(["creation", "<", today])
	elif "this month" in text:
		filters.append(["creation", ">=", get_first_day(nowdate())])
	elif "this year" in text:
		filters.append(["creation", ">=", f"{getdate(nowdate()).year}-01-01"])
	elif "last 7 days" in text or "past 7 days" in text or "this week" in text:
		filters.append(["creation", ">=", add_days(getdate(nowdate()), -7)])

	if "submitted" in text:
		filters.append(["docstatus", "=", 1])
	elif "cancelled" in text or "canceled" in text:
		filters.append(["docstatus", "=", 2])
	elif "draft" in text:
		filters.append(["docstatus", "=", 0])

	for fieldname, enabled_value, disabled_value in (
		("disabled", 0, 1),
		("enabled", 1, 0),
	):
		if not _has_field(doctype, fieldname):
			continue

		if "disabled" in text or "inactive" in text:
			filters.append([fieldname, "=", disabled_value])
		elif "enabled" in text or "active" in text:
			filters.append([fieldname, "=", enabled_value])
		break

	return filters


def _count_answer(doctype, text):
	filters = _base_filters(doctype, text)
	total = frappe.db.count(doctype, filters=filters)
	scope = _scope_text(text)
	scope_text = f" {scope}" if scope else ""

	return f"I checked live {doctype} records. Count{scope_text}: {total}."


def _group_count_answer(doctype, group_field, text):
	if group_field == "docstatus" and not _has_field(doctype, "docstatus"):
		return _missing_group_field_answer(doctype, group_field)

	filters = _base_filters(doctype, text)
	rows = frappe.get_list(
		doctype,
		filters=filters,
		fields=[f"{group_field} as group_value", "count(name) as total"],
		group_by=group_field,
		order_by="count(name) desc",
		limit_page_length=10,
	)

	field_label = _field_label(doctype, group_field)

	if not rows:
		if group_field == "docstatus":
			return f"I checked live {doctype} records, but there are no records to summarize by {field_label}."
		return f"I checked live {doctype} records, but there are no matching rows to group by {field_label}."

	parts = []
	for row in rows:
		value = row.get("group_value")
		if group_field == "docstatus":
			value = _docstatus_label(value)
		parts.append(f"{value or 'Not set'}: {row.get('total', 0)}")

	return f"I checked live {doctype} records. Count by {field_label}: {_human_join(parts)}."


def _latest_answer(doctype, text):
	filters = _base_filters(doctype, text)
	meta = frappe.get_meta(doctype)
	fields = _display_fields(doctype)

	rows = frappe.get_list(
		doctype,
		filters=filters,
		fields=fields,
		order_by="creation desc",
		limit_page_length=5,
	)

	if not rows:
		return f"I checked live {doctype} records, but I did not find any matching rows."

	records = [_format_record(row, meta, fields) for row in rows]
	return f"I checked live {doctype} records. Latest rows: {_human_join(records)}."


def _status_answer(doctype, text):
	if _has_field(doctype, "docstatus"):
		return _group_count_answer(doctype, "docstatus", text)

	status_field = _resolve_schema_field(doctype, "status")
	if status_field:
		return _group_count_answer(doctype, status_field["fieldname"], text)

	return f"I checked the live {doctype} schema, but I could not find a status field for this DocType."


def _permission_answer(doctype, text):
	action = _requested_permission_action(text)

	if action:
		allowed = _can_do(doctype, action)
		label = _permission_label(action)
		result = "can" if allowed else "cannot"
		return f"I checked your live permissions. You {result} {label} {doctype} records."

	actions = ("read", "create", "write", "submit", "cancel", "delete")
	allowed_actions = [_permission_label(action) for action in actions if _can_do(doctype, action)]

	if allowed_actions:
		return f"I checked your live permissions for {doctype}. You can {_human_join(allowed_actions)} records."

	return f"I checked your live permissions for {doctype}, but I did not find any allowed record actions for your user."


def _route_answer(doctype):
	route = _desk_route_for_doctype(doctype)
	return f"I checked the live Desk route. Open {doctype} at {route}."


def _field_answer(doctype, text):
	field = _resolve_schema_field(doctype, text)

	if field and _is_specific_field_question(text):
		return _field_detail_answer(doctype, field)

	if re.search(r"\b(?:mandatory|required|need|needed)\b", text):
		return _required_fields_answer(doctype)

	return _field_list_answer(doctype)


def _field_list_answer(doctype):
	fields = [_format_field_summary(field) for field in _visible_schema_fields(doctype)[:12]]

	if not fields:
		return f"I checked the live {doctype} schema, but I did not find visible input fields."

	return f"I checked the live {doctype} schema. Key fields include {_human_join(fields)}."


def _required_fields_answer(doctype):
	meta = frappe.get_meta(doctype)
	required_fields = _required_input_fields(meta, limit=12)
	required_tables = _required_table_fields(meta)

	if not required_fields and not required_tables:
		return f"I checked the live {doctype} schema. It does not show any required visible input fields."

	answer = f"I checked the live {doctype} schema."

	if required_fields:
		answer += f" Required fields: {_human_join(required_fields)}."

	if required_tables:
		answer += f" Required table rows: {_human_join(required_tables)}."

	return answer


def _field_detail_answer(doctype, field):
	fieldname = field["fieldname"]
	label = field["label"]

	if fieldname in STANDARD_FIELDS:
		return f"I checked the live {doctype} schema. {label} is a standard field on every {doctype} record."

	meta_field = frappe.get_meta(doctype).get_field(fieldname)
	if not meta_field:
		return f"I checked the live {doctype} schema, but I could not load details for {label}."

	details = [f"{label} is a {meta_field.fieldtype} field"]

	if getattr(meta_field, "reqd", 0):
		details.append("required")
	if getattr(meta_field, "read_only", 0):
		details.append("read-only")
	if getattr(meta_field, "hidden", 0):
		details.append("hidden")
	if meta_field.fieldtype == "Link" and meta_field.options:
		details.append(f"links to {meta_field.options}")
	elif meta_field.fieldtype in {"Table", "Table MultiSelect"} and meta_field.options:
		details.append(f"uses child rows from {meta_field.options}")
	elif meta_field.fieldtype == "Select" and meta_field.options:
		options = _select_options(meta_field.options)
		if options:
			details.append(f"options are {_human_join(options[:8])}")

	if getattr(meta_field, "description", None):
		details.append(str(meta_field.description).strip())

	return f"I checked the live {doctype} schema. {'; '.join(details)}."


def _doctype_overview_answer(doctype):
	meta = frappe.get_meta(doctype)
	total = frappe.db.count(doctype)
	route = _desk_route_for_doctype(doctype)
	field_names = [_format_field_summary(field) for field in _visible_schema_fields(doctype)[:6]]

	answer = f"I checked live {doctype} metadata. {doctype} is a {getattr(meta, 'module', None) or 'Desk'} DocType at {route}."
	answer += f" Current records: {total}."

	if field_names:
		answer += f" Key fields include {_human_join(field_names)}."

	if getattr(meta, "is_submittable", 0):
		answer += " It supports submit/cancel document status."

	return answer


def _workflow_answer(doctype, text):
	if _is_create_question(text):
		return _create_record_answer(doctype)

	route = _desk_route_for_doctype(doctype)
	return (
		f"I checked the live {doctype} setup. Open {route}, review the list filters and columns, "
		f"then open a row to view or edit it based on your permissions."
	)


def _create_record_answer(doctype):
	meta = frappe.get_meta(doctype)
	route = _desk_route_for_doctype(doctype)
	required_fields = _required_input_fields(meta)
	required_tables = _required_table_fields(meta)
	can_create = _can_create(doctype)

	answer = f"I checked the live {doctype} setup. To create a new {doctype}, open {route} and click New."

	if required_fields:
		answer += f" Fill the required fields: {_human_join(required_fields)}."

	if required_tables:
		answer += f" Add at least one row in {_human_join(required_tables)}."

	answer += " Save the document after checking the details."

	if getattr(meta, "is_submittable", 0):
		answer += " If the order is final, submit it after saving."

	if not can_create:
		answer += f" Your current user may not have create permission for {doctype}, so ask an administrator if the New button is missing."

	return answer


def _live_summary_answer(doctype, text):
	total = frappe.db.count(doctype, filters=_base_filters(doctype, text))
	fields = _field_candidates(doctype)
	field_names = [_field["label"] for _field in fields if _field["fieldname"] not in STANDARD_FIELDS][:6]
	latest = frappe.get_list(doctype, fields=_display_fields(doctype), order_by="creation desc", limit_page_length=3)

	answer = f"I checked live {doctype} data. Total records: {total}."

	if field_names:
		answer += f" Available fields include {_human_join(field_names)}."

	if latest:
		meta = frappe.get_meta(doctype)
		answer += f" Recent rows: {_human_join([_format_record(row, meta, _display_fields(doctype)) for row in latest])}."

	return answer


def _current_page_answer(page_title=None, route=None, sidebar_items=None, doctype=None):
	title = str(page_title or "").strip() or "this page"
	items = _parse_sidebar_items(sidebar_items)

	answer = f"You are on {title}."

	if doctype and _can_read(doctype):
		answer += f" I matched this screen to live {doctype} data with {frappe.db.count(doctype)} records."

	if items:
		answer += f" Visible menu entries are {_human_join(items[:8])}."

	if route:
		answer += f" Route: {route}."

	return answer


def _live_intro_answer():
	return "Hi. I can help with live ZupraTech site questions: counts, latest rows, fields, required fields, permissions, routes, statuses, and document steps."


def _site_help_answer(doctype=None, page_title=None, sidebar_items=None, include_samples=True):
	answer = (
		"I answer from live ZupraTech records and DocType metadata. You can ask about record counts, latest rows, "
		"field lists, required fields, permissions, status breakdowns, where to open a DocType, or how to create and use documents."
	)

	if doctype:
		answer += f" I matched this question to {doctype}."

	if page_title:
		answer += f" Current page: {page_title}."

	items = _parse_sidebar_items(sidebar_items)
	if items:
		answer += f" Visible menu entries include {_human_join(items[:6])}."

	if include_samples:
		doctypes = _sample_readable_doctypes()
		if doctypes:
			answer += f" Readable live areas include {_human_join(doctypes)}."

	return answer


def _unmatched_answer(text, page_title=None, sidebar_items=None):
	if not _looks_like_site_question(text):
		return "I can answer only from live ZupraTech site data. Ask about a DocType, record count, list, or field from this site."

	doctypes = _sample_readable_doctypes()
	answer = "I could not match that question to a readable live DocType."

	if page_title:
		answer += f" Current page: {page_title}."

	items = _parse_sidebar_items(sidebar_items)
	if items:
		answer += f" Visible menu entries are {_human_join(items[:6])}."

	if doctypes:
		answer += f" Try using one of these live DocType names: {_human_join(doctypes)}."

	return answer


def _missing_group_field_answer(doctype, requested_group):
	fields = [
		field["label"]
		for field in _field_candidates(doctype)
		if field["fieldname"] not in STANDARD_FIELDS
	][:8]

	answer = f"I checked the live {doctype} schema, but I could not find a field matching '{requested_group}'."

	if fields:
		answer += f" Fields I can group or inspect include {_human_join(fields)}."

	answer += f" I can still count {doctype} records or show the latest {doctype} rows."
	return answer


def _display_fields(doctype):
	meta = frappe.get_meta(doctype)
	fields = ["name", "creation"]

	for fieldname in (meta.title_field,):
		if fieldname and _has_field(doctype, fieldname) and fieldname not in fields:
			fields.append(fieldname)

	for field in meta.fields:
		if len(fields) >= 6:
			break
		if field.fieldtype in IGNORED_FIELD_TYPES or not field.fieldname:
			continue
		if field.fieldtype not in {"Data", "Link", "Select", "Date", "Datetime", "Currency", "Float", "Int"}:
			continue
		if field.fieldname not in fields:
			fields.append(field.fieldname)

	return fields


def _format_record(row, meta, fields):
	name = str(row.get("name"))
	title = row.get(meta.title_field) if meta.title_field else None
	details = []

	for fieldname in fields:
		if fieldname in {"name", "creation", meta.title_field}:
			continue

		value = row.get(fieldname)
		if value in (None, ""):
			continue

		details.append(f"{_field_label(meta.name, fieldname)}: {value}")
		if len(details) == 2:
			break

	if title and title != name:
		name = f"{name} ({title})"

	if details:
		return f"{name} [{'; '.join(details)}]"

	return name


def _field_label(doctype, fieldname):
	if fieldname in STANDARD_FIELDS:
		return STANDARD_FIELDS[fieldname]

	field = frappe.get_meta(doctype).get_field(fieldname)
	return (field.label if field and field.label else fieldname).replace("_", " ")


def _requested_permission_action(text):
	action_words = (
		("create", ("create", "add", "make", "new", "raise", "prepare", "enter")),
		("write", ("edit", "update", "change", "modify")),
		("delete", ("delete", "remove")),
		("submit", ("submit", "approve", "finalize", "finalise")),
		("cancel", ("cancel", "cancelled", "canceled")),
		("read", ("read", "view", "see", "open", "access")),
	)

	for action, words in action_words:
		if any(re.search(rf"\b{word}\b", text) for word in words):
			return action

	return None


def _permission_label(action):
	labels = {
		"read": "read",
		"create": "create",
		"write": "edit",
		"submit": "submit",
		"cancel": "cancel",
		"delete": "delete",
	}
	return labels.get(action, action)


def _can_do(doctype, action):
	try:
		return bool(frappe.has_permission(doctype, action))
	except Exception:
		return False


def _can_create(doctype):
	try:
		return bool(frappe.has_permission(doctype, "create"))
	except Exception:
		return False


def _desk_route_for_doctype(doctype):
	return f"/app/{_normalize(doctype).replace(' ', '-')}"


def _schema_field_candidates(doctype):
	meta = frappe.get_meta(doctype)
	fields = [
		{
			"fieldname": fieldname,
			"label": label,
			"fieldtype": "Standard",
			"reqd": 0,
			"hidden": 0,
		}
		for fieldname, label in STANDARD_FIELDS.items()
	]
	ignored = IGNORED_FIELD_TYPES - {"Table", "Table MultiSelect"}

	for field in meta.fields:
		if field.fieldtype in ignored or not field.fieldname:
			continue

		fields.append(
			{
				"fieldname": field.fieldname,
				"label": field.label or field.fieldname,
				"fieldtype": field.fieldtype,
				"reqd": getattr(field, "reqd", 0),
				"hidden": getattr(field, "hidden", 0),
			}
		)

	return fields


def _visible_schema_fields(doctype):
	return [
		field
		for field in _schema_field_candidates(doctype)
		if not field.get("hidden") and field["fieldname"] not in STANDARD_FIELDS
	]


def _resolve_schema_field(doctype, text):
	best_field = None
	best_score = 0

	for field in _schema_field_candidates(doctype):
		aliases = _full_phrase_variants(field["fieldname"].replace("_", " ")) | _full_phrase_variants(field["label"])
		score = 0

		for alias in aliases:
			if not alias or not _contains_phrase(text, alias):
				continue

			score += 10 + len(alias.split())
			if alias == _normalize(field["label"]) or alias == _normalize(field["fieldname"].replace("_", " ")):
				score += 8

		if score > best_score:
			best_field = field
			best_score = score

	return best_field if best_score else None


def _is_specific_field_question(text):
	return bool(
		re.search(r"\b(?:what is|meaning of|explain|describe|field called|field named|column called|column named)\b", text)
		or (
			re.search(r"\b(?:field|column|value)\b", text)
			and not re.search(r"\b(?:fields|columns|schema|all fields|field list)\b", text)
		)
	)


def _format_field_summary(field):
	label = field["label"]
	fieldtype = field.get("fieldtype")
	parts = []

	if fieldtype and fieldtype != "Standard":
		parts.append(fieldtype)
	if field.get("reqd"):
		parts.append("required")

	if parts:
		return f"{label} ({', '.join(parts)})"

	return label


def _select_options(options):
	return [
		re.sub(r"\s+", " ", option).strip()
		for option in str(options or "").splitlines()
		if re.sub(r"\s+", " ", option).strip()
	]


def _required_input_fields(meta, limit=8):
	fields = []

	for field in meta.fields:
		if len(fields) >= limit:
			break
		if not getattr(field, "reqd", 0):
			continue
		if getattr(field, "hidden", 0):
			continue
		if getattr(field, "read_only", 0) and getattr(field, "default", None):
			continue
		if field.fieldtype in IGNORED_FIELD_TYPES:
			continue

		label = field.label or field.fieldname
		if label and label not in fields:
			fields.append(label)

	return fields


def _required_table_fields(meta, limit=3):
	tables = []

	for field in meta.fields:
		if len(tables) >= limit:
			break
		if field.fieldtype not in {"Table", "Table MultiSelect"}:
			continue
		if getattr(field, "hidden", 0):
			continue
		if not getattr(field, "reqd", 0) and field.fieldname != "items":
			continue

		label = field.label or field.fieldname
		child_fields = _required_child_table_fields(field)
		if child_fields:
			label = f"{label} with {_human_join(child_fields)}"

		if label not in tables:
			tables.append(label)

	return tables


def _required_child_table_fields(table_field, limit=4):
	if not getattr(table_field, "options", None):
		return []

	try:
		child_meta = frappe.get_meta(table_field.options)
	except Exception:
		return []

	fields = []
	for field in child_meta.fields:
		if len(fields) >= limit:
			break
		if not getattr(field, "reqd", 0):
			continue
		if getattr(field, "hidden", 0):
			continue
		if getattr(field, "read_only", 0) and getattr(field, "default", None):
			continue
		if field.fieldtype in IGNORED_FIELD_TYPES:
			continue

		label = field.label or field.fieldname
		if label and label not in fields:
			fields.append(label)

	return fields


def _docstatus_label(value):
	try:
		return {0: "Draft", 1: "Submitted", 2: "Cancelled"}.get(int(value), value)
	except Exception:
		return value


def _scope_text(text):
	if "today" in text:
		return "created today"
	if "yesterday" in text:
		return "created yesterday"
	if "this month" in text:
		return "created this month"
	if "this year" in text:
		return "created this year"
	if "last 7 days" in text or "past 7 days" in text or "this week" in text:
		return "created in the last 7 days"
	if "submitted" in text:
		return "where document status is Submitted"
	if "cancelled" in text or "canceled" in text:
		return "where document status is Cancelled"
	if "draft" in text:
		return "where document status is Draft"
	if "disabled" in text or "inactive" in text:
		return "where the matching active flag is off"
	if "enabled" in text or "active" in text:
		return "where the matching active flag is on"

	return ""


def _looks_like_site_question(text):
	if any(_contains_phrase(text, word) for word in SITE_WORDS):
		return True

	readable_names = " ".join(_normalize(doctype) for doctype in _readable_doctypes())
	return any(token in readable_names for token in _tokenize(text))


def _sample_readable_doctypes(limit=8):
	readable = _readable_doctypes()
	readable_set = set(readable)
	samples = [doctype for doctype in PREFERRED_SAMPLE_DOCTYPES if doctype in readable_set]

	for doctype in readable:
		if len(samples) >= limit:
			break
		if doctype in samples or _is_internal_sample_doctype(doctype):
			continue
		samples.append(doctype)

	return samples[:limit]


def _is_internal_sample_doctype(doctype):
	if doctype in INTERNAL_SAMPLE_DOCTYPES:
		return True

	return any(doctype.startswith(prefix) for prefix in INTERNAL_SAMPLE_PREFIXES)


def _parse_sidebar_items(sidebar_items):
	if isinstance(sidebar_items, (list, tuple)):
		raw_items = sidebar_items
	else:
		raw_items = str(sidebar_items or "").splitlines()

	items = []
	for item in raw_items:
		value = re.sub(r"\s+", " ", str(item or "")).strip()
		if value and value not in items:
			items.append(value)

	return items


def _human_join(items):
	items = [str(item) for item in items if item not in (None, "")]

	if not items:
		return ""

	if len(items) == 1:
		return items[0]

	if len(items) == 2:
		return f"{items[0]} and {items[1]}"

	return f"{', '.join(items[:-1])}, and {items[-1]}"
