app_name = "product_customization"
app_title = "Product Customization"
app_publisher = "Pavan"
app_description = "Customizations and extensions for Product doctype"
app_email = "pavanshinde51905@gmail.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "product_customization",
# 		"logo": "/assets/product_customization/logo.png",
# 		"title": "Product Customization",
# 		"route": "/product_customization",
# 		"has_permission": "product_customization.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = ["/assets/product_customization/css/product_customization.css?v=20260714_04"]
app_include_js = ["/assets/product_customization/js/product_theme_loader_20260629_5.js?v=20260714_04"]

# Branding and Custom Logo Hooks
app_logo_url = "/assets/product_customization/images/zupra_logo.png"

update_website_context = [
    "product_customization.login_override.update_website_context"
]

extend_bootinfo = [
    "product_customization.login_override.extend_bootinfo"
]

after_migrate = [
    "product_customization.login_override.after_migrate"
]

# include js, css files in header of web template
# web_include_css = "/assets/product_customization/css/product_customization.css"
# web_include_js = "/assets/product_customization/js/product_customization.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "product_customization/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "product_customization/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "product_customization.utils.jinja_methods",
# 	"filters": "product_customization.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "product_customization.install.before_install"
# after_install = "product_customization.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "product_customization.uninstall.before_uninstall"
# after_uninstall = "product_customization.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "product_customization.utils.before_app_install"
# after_app_install = "product_customization.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "product_customization.utils.before_app_uninstall"
# after_app_uninstall = "product_customization.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "product_customization.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"product_customization.tasks.all"
# 	],
# 	"daily": [
# 		"product_customization.tasks.daily"
# 	],
# 	"hourly": [
# 		"product_customization.tasks.hourly"
# 	],
# 	"weekly": [
# 		"product_customization.tasks.weekly"
# 	],
# 	"monthly": [
# 		"product_customization.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "product_customization.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "product_customization.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "product_customization.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["product_customization.utils.before_request"]
# after_request = ["product_customization.utils.after_request"]

# Job Events
# ----------
# before_job = ["product_customization.utils.before_job"]
# after_job = ["product_customization.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"product_customization.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []
