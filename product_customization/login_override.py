import frappe

def update_website_context(context):
    context["app_name"] = "ZupraTech"
    context["logo"] = "/assets/product_customization/images/zupra_logo.png"
    context["app_logo"] = "/assets/product_customization/images/zupra_logo.png"
    context["splash_image"] = "/assets/product_customization/images/zupra_logo.png"
    context["favicon"] = "/assets/product_customization/images/zupra_logo.png"

def extend_bootinfo(bootinfo):
    bootinfo.app_logo_url = "/assets/product_customization/images/zupra_logo.png"

def after_migrate():
    # Update settings in database to ensure standard fallback works
    try:
        doc = frappe.get_doc("Website Settings")
        doc.app_logo = "/assets/product_customization/images/zupra_logo.png"
        doc.app_name = "ZupraTech"
        doc.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error updating Website Settings in after_migrate: {str(e)}")

    try:
        doc = frappe.get_doc("Navbar Settings")
        doc.app_logo = "/assets/product_customization/images/zupra_logo.png"
        doc.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error updating Navbar Settings in after_migrate: {str(e)}")
