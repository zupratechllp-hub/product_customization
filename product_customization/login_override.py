import frappe

LOGO_PATH = "/assets/product_customization/images/zupra_logo.png"

def update_website_context(context):
    context["app_name"] = "Zupra Tech"
    context["logo"] = LOGO_PATH
    context["app_logo"] = LOGO_PATH
    context["splash_image"] = LOGO_PATH
    context["favicon"] = LOGO_PATH

def extend_bootinfo(bootinfo):
    bootinfo.app_logo_url = LOGO_PATH

    bootinfo.lang_dict["Plant Floor"] = "Plant"
    bootinfo.lang_dict["Visual Plant Floor"] = "Visual Plant"
def after_migrate():
    # Update settings in database to ensure standard fallback works
    try:
        doc = frappe.get_doc("Website Settings")
        doc.app_logo = LOGO_PATH
        doc.app_name = "Zupra Tech"
        doc.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error updating Website Settings in after_migrate: {str(e)}")

    try:
        doc = frappe.get_doc("Navbar Settings")
        doc.app_logo = LOGO_PATH
        doc.save(ignore_permissions=True)
    except Exception as e:
        frappe.log_error(f"Error updating Navbar Settings in after_migrate: {str(e)}")
