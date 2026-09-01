import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	"""Ensure ERPNext's billing contact custom field exists on Contact."""
	create_custom_fields(
		{
			"Contact": [
				{
					"label": "Is Billing Contact",
					"fieldname": "is_billing_contact",
					"fieldtype": "Check",
					"insert_after": "is_primary_contact",
				}
			]
		},
		update=True,
	)

	frappe.clear_cache(doctype="Contact")
	if not frappe.db.has_column("Contact", "is_billing_contact"):
		frappe.db.updatedb("Contact")
		frappe.clear_cache(doctype="Contact")