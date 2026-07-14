(function () {
  const version = "20260714_10";

  function loadStylesheet() {
    const href = `/assets/product_customization/css/product_customization.css?v=${version}`;
    const existing = document.querySelector("link[data-product-theme-css]");

    if (existing) {
      existing.href = href;
      existing.setAttribute("data-product-theme-css", version);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-product-theme-css", version);
    document.head.appendChild(link);
  }

  function loadScript() {
    const existing = document.querySelector("script[data-product-theme-js]");

    if (existing) {
      existing.src = `/assets/product_customization/js/product_customization.js?v=${version}`;
      existing.setAttribute("data-product-theme-js", version);
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
