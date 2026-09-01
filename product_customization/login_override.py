import frappe

def update_website_context(context):
    context["app_name"] = "Zupra Tech"
    context["logo"] = "/assets/product_customization/images/z_logo_icon_v2.svg"
    context["app_logo"] = "/assets/product_customization/images/z_logo_icon_v2.svg"
    context["splash_image"] = "/assets/product_customization/images/z_logo_icon_v2.svg"
    context["favicon"] = "/assets/product_customization/images/z_logo_icon_v2.svg"

def extend_bootinfo(bootinfo):
    bootinfo.app_logo_url = "/assets/product_customization/images/z_logo_icon_v2.svg"

def after_migrate():
    # Update settings in database to ensure standard fallback works
    try:
        doc = frappe.get_doc("Website Settings")
        doc.app_logo = "/assets/product_customization/images/z_logo_icon_v2.svg"
        doc.app_name = "Zupra Tech"
        doc.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error updating Website Settings in after_migrate: {str(e)}")

    try:
        doc = frappe.get_doc("Navbar Settings")
        doc.app_logo = "/assets/product_customization/images/z_logo_icon_v2.svg"
        doc.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error updating Navbar Settings in after_migrate: {str(e)}")
