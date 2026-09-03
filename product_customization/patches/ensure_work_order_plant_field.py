import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
    """Add Plant selection to Work Order."""
    create_custom_fields(
        {
            "Work Order": [
                {
                    "label": "Plant",
                    "fieldname": "plant",
                    "fieldtype": "Link",
                    "options": "Plant Floor",
                    "insert_after": "project",
                    "in_standard_filter": 1,
                }
            ]
        },
        update=True,
    )

    frappe.clear_cache(doctype="Work Order")
    if not frappe.db.has_column("Work Order", "plant"):
        frappe.db.updatedb("Work Order")
        frappe.clear_cache(doctype="Work Order")
