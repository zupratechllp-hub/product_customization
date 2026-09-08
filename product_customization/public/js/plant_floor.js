const PLANT_WAREHOUSES = ["Finished Goods", "Stores", "Work In Progress"];

function fitPlantFloorPanelToViewport(frm) {
	const formLayout = frm.wrapper?.querySelector(".form-layout");

	if (!formLayout) {
		return;
	}

	const viewportHeight = window.visualViewport?.height || window.innerHeight;
	const panelTop = Math.max(0, formLayout.getBoundingClientRect().top);

	formLayout.style.minHeight = `${Math.max(0, Math.ceil(viewportHeight - panelTop))}px`;
}

frappe.ui.form.on("Plant Floor", {
	setup(frm) {
		frm.set_query("warehouses", () => ({
			filters: {
				company: frm.doc.company,
				is_group: 0,
				disabled: 0,
				warehouse_name: ["in", PLANT_WAREHOUSES],
			},
		}));
	},
	refresh(frm) {
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
