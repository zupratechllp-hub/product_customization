function fitPlantFloorPanelToViewport(frm) {
	const formLayout = frm.wrapper?.querySelector(".form-layout");

	if (!formLayout) {
		return;
	}

	const viewportHeight = window.visualViewport?.height || window.innerHeight;
	const panelTop = Math.max(0, formLayout.getBoundingClientRect().top);

	formLayout.style.minHeight = `${Math.max(0, Math.ceil(viewportHeight - panelTop))}px`;
}

function markWarehouseAdditionsDirty(frm) {
	const warehouseField = frm.fields_dict.warehouses;

	if (!warehouseField || warehouseField._plantFloorDirtyHandlerInstalled) {
		return;
	}

	const parse = warehouseField.parse;
	warehouseField.parse = function (value, label) {
		const rows = parse.call(this, value, label);

		// Table MultiSelect appends a row to the existing array without triggering Form.dirty().
		if (typeof value === "string" && value) {
                frm.enable_save();
			frm.dirty();
		}

		return rows;
	};
	warehouseField._plantFloorDirtyHandlerInstalled = true;
}

frappe.ui.form.on("Plant Floor", {
	setup(frm) {
		frm.set_query("warehouses", () => ({
			filters: {
				company: frm.doc.company,
				is_group: 0,
				disabled: 0,
			},
		}));
	},
	refresh(frm) {
		markWarehouseAdditionsDirty(frm);
		window.requestAnimationFrame(() => fitPlantFloorPanelToViewport(frm));

		if (frm._plantFloorViewportHandler) {
			return;
		}

		frm._plantFloorViewportHandler = () => {
			window.requestAnimationFrame(() => fitPlantFloorPanelToViewport(frm));
		};

		window.addEventListener("resize", frm._plantFloorViewportHandler);
		window.visualViewport?.addEventListener("resize", frm._plantFloorViewportHandler);
	},
});
