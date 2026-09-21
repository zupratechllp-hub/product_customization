import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields
from frappe.custom.doctype.property_setter.property_setter import make_property_setter


def execute():
	create_custom_fields(
		{
			"Plant Floor": [
				{
					"fieldname": "warehouses",
					"label": "Warehouses",
					"fieldtype": "Table MultiSelect",
					"options": "Plant Warehouse",
					"insert_after": "company",
				}
			]
		},
		update=True,
	)

	make_property_setter("Plant Floor", "warehouse", "hidden", 1, "Check")
	frappe.clear_cache(doctype="Plant Floor")
