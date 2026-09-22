(function () {
  const version = "20260908_01";
  let stylesheetRefreshTimer = null;
  let themeObserver = null;
  let bodyThemeObserved = false;

  function keepStylesheetLast(link) {
    if (link && link.parentNode === document.head && link.nextElementSibling) {
      document.head.appendChild(link);
    }
  }

  function loadStylesheet() {
    const href = `/assets/product_customization/css/product_customization.css?v=${version}`;
    const existing = document.querySelector("link[data-product-theme-css]");

    if (existing) {
      if (existing.getAttribute("href") !== href) {
        existing.href = href;
      }
      if (existing.getAttribute("data-product-theme-css") !== version) {
        existing.setAttribute("data-product-theme-css", version);
      }
      keepStylesheetLast(existing);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-product-theme-css", version);
    document.head.appendChild(link);
  }

  function scheduleStylesheetRefresh() {
    window.clearTimeout(stylesheetRefreshTimer);
    stylesheetRefreshTimer = window.setTimeout(loadStylesheet, 0);
  }

  function observeThemeChanges() {
    if (!window.MutationObserver || !document.head) {
      return;
    }

    if (!themeObserver) {
      themeObserver = new MutationObserver(scheduleStylesheetRefresh);
      themeObserver.observe(document.head, { childList: true });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    }

    if (document.body && !bodyThemeObserved) {
      themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
      bodyThemeObserved = true;
    }
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
  observeThemeChanges();
  onReady(() => {
    observeThemeChanges();
    ensureAskZupraFallbackButton();
    loadScript();
    setTimeout(ensureAskZupraFallbackButton, 300);
  });

  window.addEventListener("resize", ensureAskZupraFallbackButton);
})();
(() => {
  const oldLabel = "Plant Floor";
  const newLabel = "Plant";
  const replace = (value) => value.replaceAll(oldLabel, newLabel);

  const update = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
      if (textNode.nodeValue.includes(oldLabel)) textNode.nodeValue = replace(textNode.nodeValue);
    }
  };

  const install = () => {
    frappe.boot.lang_dict[oldLabel] = newLabel;
    frappe.boot.lang_dict["Visual Plant Floor"] = "Visual Plant";
    update(document.body);
    new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes(oldLabel)) {
          node.nodeValue = replace(node.nodeValue);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          update(node);
        }
      }));
    }).observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();

/* Preserve organisation-structure context for its setup links. */
(() => {
  const contextKey = "zupra_organisation_structure_breadcrumb";
  const workspacePath = "/app/organisation-structure";
  const destinations = {
    "/app/customer": "Client",
    "/app/company": "Company code",
    "/app/account": "Chart account",
    "/app/plant-floor": "Plant",
    "/app/warehouse": "Storage location",
  };

  function getDestinationLabel(path) {
    const destination = Object.entries(destinations).find(([destinationPath]) =>
      path === destinationPath || path.startsWith(`${destinationPath}/`)
    );
    return destination ? destination[1] : "";
  }

  function getCurrentRouteLabel(path, destinationPath, destinationLabel) {
    if (!destinationPath || path === destinationPath) return "";

    const routeName = decodeURIComponent(path.slice(destinationPath.length + 1)).split("/")[0];
    // New documents have an internal route such as `new-plant-floor-1`, but
    // their navbar label should match the form title users see.
    if (routeName.startsWith("new-")) return `New ${destinationLabel}`;
    return routeName.replace(/-/g, " ");
  }

  function saveContext(event) {
    if (window.location.pathname.replace(/\/$/, "") !== workspacePath) return;

    const link = event.target.closest("a[href]");
    const widget = event.target.closest(".link-item, .shortcut-widget-box, .widget");
    const path = link ? new URL(link.href, window.location.origin).pathname.replace(/\/$/, "") : "";
    const labelFromUrl = getDestinationLabel(path);
    const widgetText = (widget?.textContent || "").replace(/\s+/g, " ").trim();
    const labelFromWidget = Object.values(destinations).find((label) => widgetText === label);
    const label = labelFromUrl || labelFromWidget;

    if (label) sessionStorage.setItem(contextKey, label);
  }

  function updateBreadcrumb() {
    const path = window.location.pathname.replace(/\/$/, "");
    const label = getDestinationLabel(path);
    if (!label || sessionStorage.getItem(contextKey) !== label) {
      if (path !== workspacePath) sessionStorage.removeItem(contextKey);
      return;
    }

    const destinationPath = Object.keys(destinations).find((candidate) =>
      path === candidate || path.startsWith(`${candidate}/`)
    );
    const currentLabel = getCurrentRouteLabel(path, destinationPath, label);
    const breadcrumbs = document.querySelector("#navbar-breadcrumbs, .navbar-breadcrumbs");
    const expectedText = ["Organisation structure", label, currentLabel].filter(Boolean).join(" ");
    const breadcrumbText = breadcrumbs?.textContent.replace(/\s+/g, " ").trim();
    if (!breadcrumbs || (breadcrumbText === expectedText &&
      breadcrumbs.querySelectorAll("a[href]").length >= (currentLabel ? 3 : 2))) return;
    breadcrumbs.replaceChildren();
    breadcrumbs.dataset.zupraOrganisationBreadcrumb = "true";

    const makeBreadcrumbLink = (href, text) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = href;
      link.textContent = text;
      link.style.cursor = "pointer";
      item.append(link);
      return item;
    };

    breadcrumbs.append(
      makeBreadcrumbLink(workspacePath, "Organisation structure"),
      makeBreadcrumbLink(destinationPath || path, label),
    );
    if (currentLabel) breadcrumbs.append(makeBreadcrumbLink(path, currentLabel));
  }

  // Some Desk navbar layouts put a transparent element above the breadcrumb
  // text. Resolve the visible link by its click coordinates so the intended
  // route still works even when that happens.
  document.addEventListener("click", (event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const breadcrumbs = document.querySelector('[data-zupra-organisation-breadcrumb="true"]');
    if (!breadcrumbs) return;

    const link = Array.from(breadcrumbs.querySelectorAll("a[href]")).find((candidate) => {
      const bounds = candidate.getBoundingClientRect();
      return event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    });
    if (!link) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(link.href);
  }, true);

  document.addEventListener("click", saveContext, true);
  const scheduleUpdate = () => window.setTimeout(updateBreadcrumb, 0);
  window.frappe?.router?.on?.("change", scheduleUpdate);
  document.addEventListener("DOMContentLoaded", scheduleUpdate);
  new MutationObserver(scheduleUpdate).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();