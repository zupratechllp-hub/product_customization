(() => {
  function install() {
    if (!window.frappe?.ui?.misc || !frappe.ui.Dialog) return setTimeout(install, 100);
    frappe.ui.misc.about = () => {
      const dialog = new frappe.ui.Dialog({ title: __("Zupra ERP") });
      $(dialog.body).html(`<div>
        <p><strong>Zupra ERP</strong> is a cloud-native ERP platform for growing Indian businesses, combining practical business workflows with Zupra Tech's SAP expertise.</p>
        <p><i class="fa fa-globe fa-fw"></i> Website: <a href="https://zupratech.com/about.html" target="_blank">zupratech.com</a></p>
        <p><i class="fa fa-envelope fa-fw"></i> Email: <a href="mailto:support@zupratech.com">support@zupratech.com</a></p>
        <p><i class="fa fa-phone fa-fw"></i> Contact: <a href="tel:+919689873635">+91 96898 73635</a></p>
        <p><i class="fa fa-map-marker fa-fw"></i> Pune, Maharashtra, India</p>
        <p><i class="fa fa-linkedin fa-fw"></i> LinkedIn: <a href="https://www.linkedin.com/company/zupra-tech/" target="_blank">Zupra Tech</a></p>
        <hr><p class="text-muted">&copy; ${new Date().getFullYear()} ZUPRA TECH LLP. All rights reserved.</p>
      </div>`);
      dialog.show();
    };
  }
  install();
})();