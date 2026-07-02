(function () {
  const version = "20260629_3";

  function loadStylesheet() {
    const href = `/assets/product_customization/css/product_customization.css?v=${version}`;
    const existing = document.querySelector("link[data-product-theme-css]");

    if (existing) {
      existing.href = href;
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-product-theme-css", version);
    document.head.appendChild(link);
  }

  function loadScript() {
    if (document.querySelector("script[data-product-theme-js]")) {
      return;
    }

    const script = document.createElement("script");
    script.src = `/assets/product_customization/js/product_customization.js?v=${version}`;
    script.defer = true;
    script.setAttribute("data-product-theme-js", version);
    document.head.appendChild(script);
  }

  loadStylesheet();
  loadScript();
})();
