import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	"""Ensure ERPNext's company-address marker is present on Address.

	ERPNext filters shipping addresses by this field in several transaction
	doctypes. Older sites can have the ERPNext code without the corresponding
	custom-field column, which makes every such lookup fail at the database.
	"""
	create_custom_fields(
		{
			"Address": [
				{
					"label": "Is Your Company Address",
					"fieldname": "is_your_company_address",
					"fieldtype": "Check",
					"default": "0",
					"insert_after": "is_shipping_address",
					"hidden": 1,
				}
			]
		},
		update=True,
	)

	# Repair installations where the Custom Field record exists but its database
	# column was not created (for example, after an interrupted migration).
	if not frappe.db.has_column("Address", "is_your_company_address"):
		frappe.db.updatedb("Address")

	# Bring existing company-linked addresses in line with the controller logic,
	# which sets this marker whenever an Address links to a Company.
	frappe.db.sql(
		"""
		UPDATE `tabAddress`
		SET is_your_company_address = 1
		WHERE name IN (
			SELECT parent
			FROM `tabDynamic Link`
			WHERE parenttype = 'Address' AND link_doctype = 'Company'
		)
		"""
	)

	frappe.clear_cache(doctype="Address")

