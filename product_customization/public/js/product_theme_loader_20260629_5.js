(function () {
  const version = "20260819_06";

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
    const existing = document.querySelector("script[data-product-theme-js]") ||
      Array.from(document.scripts).find((script) => (script.src || "").includes("/assets/product_customization/js/product_customization.js"));

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

  function openAskZupraAfterLoad() {
    const tryOpen = () => {
      if (typeof window.customAskZupraOpen === "function") {
        window.customAskZupraOpen(true);
        return true;
      }

      return false;
    };

    if (tryOpen()) {
      return;
    }

    loadScript();
    [50, 150, 350, 700, 1200].forEach((delay) => setTimeout(tryOpen, delay));
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function getSearchTarget() {
    return Array.from(document.querySelectorAll(
      ".navbar input[type='text'], .top-bar input[type='text'], .navbar input[type='search'], .top-bar input[type='search']"
    )).find((input) => {
      const rect = input.getBoundingClientRect();
      return rect.width > 80 && rect.height > 20;
    });
  }

  function positionAskZupraFallback(button) {
    const searchTarget = getSearchTarget();
    const buttonWidth = button.offsetWidth || 108;
    const buttonHeight = button.offsetHeight || 34;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    let left = Math.min(Math.max(viewportWidth * 0.54, 260), 1050);
    let top = 8;

    if (searchTarget) {
      const rect = searchTarget.getBoundingClientRect();
      left = rect.left - buttonWidth - 16;
      top = rect.top + ((rect.height - buttonHeight) / 2);
    }

    if (viewportWidth < 768) {
      left = Math.max(12, viewportWidth - buttonWidth - 12);
      top = 8;
    }

    button.style.setProperty("--custom-ask-zupra-left", `${Math.round(Math.max(12, left))}px`);
    button.style.setProperty("--custom-ask-zupra-top", `${Math.round(Math.max(6, top))}px`);
  }

  function ensureAskZupraFallbackButton() {
    if (!document.body) {
      return;
    }

    let button = document.querySelector(".custom-ask-zupra-button");

    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "custom-ask-zupra-button";
      button.textContent = "Ask Zupra";
      button.setAttribute("aria-controls", "custom-ask-zupra-popup");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open Ask Zupra chatbot");
      document.body.appendChild(button);
    }

    if (!button.dataset.askZupraFallbackBound) {
      button.dataset.askZupraFallbackBound = "1";
      button.addEventListener("click", (event) => {
        if (button.dataset.askZupraMainBound === "1") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        openAskZupraAfterLoad();
      });
    }

    positionAskZupraFallback(button);
  }

  loadStylesheet();
  onReady(() => {
    ensureAskZupraFallbackButton();
    loadScript();
    setTimeout(ensureAskZupraFallbackButton, 300);
  });

  window.addEventListener("resize", ensureAskZupraFallbackButton);
})();
