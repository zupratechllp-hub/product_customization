import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields
from frappe.custom.doctype.property_setter.property_setter import make_property_setter
from product_customization.events.plant_floor import sync_all_warehouse_plants


def execute():
	create_custom_fields(
		{
			"Warehouse": [
				{
					"fieldname": "custom_plant",
					"label": "Plant",
					"fieldtype": "Link",
					"options": "Plant Floor",
					"insert_after": "company",
					"in_list_view": 1,
					"in_standard_filter": 1,
					"search_index": 1,
				}
			]
		},
		update=True,
	)

	make_property_setter("Warehouse", "company", "in_list_view", 0, "Check")
	make_property_setter("Warehouse", "company", "in_standard_filter", 0, "Check")
	sync_all_warehouse_plants()
	frappe.clear_cache(doctype="Warehouse")
