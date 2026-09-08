import frappe


def sync_warehouse_plants(doc, method=None):
	current_warehouses = _get_warehouses(doc)
	before_save = doc.get_doc_before_save()
	previous_warehouses = _get_warehouses(before_save)
	changed = False

	for warehouse in sorted(current_warehouses - previous_warehouses):
		frappe.db.set_value("Warehouse", warehouse, "custom_plant", doc.name)
		changed = True

	for warehouse in sorted(previous_warehouses - current_warehouses):
		if frappe.db.get_value("Warehouse", warehouse, "custom_plant") == doc.name:
			frappe.db.set_value("Warehouse", warehouse, "custom_plant", "")
			changed = True

	if changed:
		frappe.clear_cache(doctype="Warehouse")


def clear_warehouse_plants(doc, method=None):
	changed = False

	for warehouse in _get_warehouses(doc):
		if frappe.db.get_value("Warehouse", warehouse, "custom_plant") == doc.name:
			frappe.db.set_value("Warehouse", warehouse, "custom_plant", "")
			changed = True

	if changed:
		frappe.clear_cache(doctype="Warehouse")


def sync_all_warehouse_plants():
	changed = False
	plant_floors = frappe.get_all("Plant Floor", fields=["name"], order_by="modified asc, name asc")

	for plant_floor in plant_floors:
		warehouses = frappe.get_all(
			"Plant Warehouse",
			filters={
				"parent": plant_floor.name,
				"parenttype": "Plant Floor",
				"parentfield": "warehouses",
			},
			pluck="warehouse",
		)

		for warehouse in warehouses:
			if frappe.db.get_value("Warehouse", warehouse, "custom_plant") != plant_floor.name:
				frappe.db.set_value("Warehouse", warehouse, "custom_plant", plant_floor.name)
				changed = True

	if changed:
		frappe.clear_cache(doctype="Warehouse")


def _get_warehouses(doc):
	if not doc:
		return set()

	return {
		row.get("warehouse")
		for row in doc.get("warehouses", [])
		if row.get("warehouse")
	}
