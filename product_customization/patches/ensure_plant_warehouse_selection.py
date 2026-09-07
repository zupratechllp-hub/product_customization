import frappe
from frappe.custom.doctype.property_setter.property_setter import make_property_setter


WAREHOUSE_LABELS = ("Finished Goods", "Stores", "Work In Progress")


def execute():
	company = frappe.db.get_value("Company", "zupra tech", "name")
	if not company:
		return

	warehouses = frappe.get_all(
		"Warehouse",
		filters={
			"company": company,
			"is_group": 0,
			"disabled": 0,
			"warehouse_name": ["in", WAREHOUSE_LABELS],
		},
		fields=["name", "warehouse_name"],
	)
	warehouse_names = {warehouse.warehouse_name: warehouse.name for warehouse in warehouses}
	if not all(label in warehouse_names for label in WAREHOUSE_LABELS):
		return

	make_property_setter("Plant Floor", "warehouse", "fieldtype", "Select", "Select")
	make_property_setter(
		"Plant Floor",
		"warehouse",
		"options",
		"\n".join(warehouse_names[label] for label in WAREHOUSE_LABELS),
		"Text",
	)
	frappe.clear_cache(doctype="Plant Floor")
