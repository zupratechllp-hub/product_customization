(function () {
  const titleToggleClass = "custom-title-sidebar-toggle";
  const originalToggleClass = "custom-original-sidebar-toggle";
  const brandClass = "custom-zupra-brand";
  const askZupraButtonClass = "custom-ask-zupra-button";
  const askZupraPopupId = "custom-ask-zupra-popup";
  let scheduleTimers = [];

  function getTitleArea() {
    return document.querySelector(".page-head .title-area");
  }

  function getTitleText(titleArea) {
    return titleArea && (
      titleArea.querySelector(".title-text") ||
      titleArea.querySelector(".page-title") ||
      titleArea.querySelector(".page-head-title") ||
      titleArea.querySelector("h1")
    );
  }

  function isMenuToggle(button) {
    if (!button || button.classList.contains(titleToggleClass)) {
      return false;
    }

    const label = [
      button.getAttribute("aria-label"),
      button.getAttribute("title"),
      button.getAttribute("data-original-title"),
      button.textContent,
    ].filter(Boolean).join(" ").toLowerCase();

    return button.matches(".sidebar-toggle-btn, .btn-sidebar-toggle, .menu-btn, .navbar-toggle, [data-toggle='sidebar']") ||
      label.includes("menu") ||
      label.includes("sidebar") ||
      label.trim() === "";
  }

  function looksLikeThreeLineToggle(button) {
    if (!button || button.classList.contains(titleToggleClass)) {
      return false;
    }

    const rect = button.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return false;
    }

    return rect.top > 55 && rect.top < 160 && rect.left > 60 && rect.left < 260 && rect.width <= 80 && rect.height <= 80;
  }

  function closestClickable(element) {
    return element && element.closest && element.closest("button, a, [role='button'], .btn");
  }

  function findToggleFromScreenPosition() {
    const points = [
      [145, 100],
      [150, 95],
      [135, 100],
      [160, 100],
    ];

    for (const point of points) {
      const clickable = closestClickable(document.elementFromPoint(point[0], point[1]));
      if (looksLikeThreeLineToggle(clickable)) {
        return clickable;
      }
    }

    return null;
  }

  function findSidebarToggle(titleArea) {
    const preferred = document.querySelector(
      ".page-head .sidebar-toggle-btn, .page-head .btn-sidebar-toggle, .page-head .menu-btn, .page-head [data-toggle='sidebar']"
    );

    if (isMenuToggle(preferred)) {
      return preferred;
    }

    return Array.from(document.querySelectorAll(".page-head button, .page-head .btn, .page-head a"))
      .find((button) => !titleArea.contains(button) && isMenuToggle(button)) ||
      findToggleFromScreenPosition() ||
      Array.from(document.querySelectorAll("button, .btn, a"))
        .find((button) => !titleArea.contains(button) && looksLikeThreeLineToggle(button));
  }

  function clickOriginalToggle() {
    const originalToggle = document.querySelector(`.${originalToggleClass}`) || findSidebarToggle(getTitleArea());
    if (originalToggle) {
      originalToggle.click();
    }
  }

  function buildProxyToggle(originalToggle) {
    const proxy = document.createElement("button");
    proxy.type = "button";
    proxy.className = titleToggleClass;
    proxy.setAttribute("aria-label", "Toggle sidebar");
    proxy.innerHTML = "<span></span><span></span><span></span>";

    proxy.addEventListener("click", clickOriginalToggle);

    if (originalToggle) {
      originalToggle.classList.add(originalToggleClass);
    }

    return proxy;
  }

  function moveSidebarToggle() {
    const titleArea = getTitleArea();
    const titleText = getTitleText(titleArea);

    if (!titleArea || !titleText) {
      return;
    }

    const existing = titleArea.querySelector(`.${titleToggleClass}`);
    if (existing && existing.nextElementSibling === titleText) {
      return;
    }

    const originalToggle = document.querySelector(`.${originalToggleClass}`) || findSidebarToggle(titleArea);

    const toggle = existing || buildProxyToggle(originalToggle);
    if (originalToggle) {
      originalToggle.classList.add(originalToggleClass);
    }

    titleArea.insertBefore(toggle, titleText);
  }

  function findNavbarBrand() {
    const selector = [
      ".navbar .navbar-brand", ".navbar .navbar-home", ".top-bar .navbar-brand",
      ".top-bar .navbar-home", ".navbar-brand", ".navbar-home",
    ].join(", ");
    const brand = Array.from(document.querySelectorAll(selector))
      .find((element) => element.offsetParent !== null);
    if (brand) {
      return brand;
    }

    const logo = document.querySelector(".navbar .app-logo, .top-bar .app-logo, .app-logo");
    return logo && (logo.closest("a, .navbar-brand, .navbar-home") || logo.parentElement);
  }

  function applyBranding() {
    const navbar = document.querySelector(".navbar, .navbar-default, .top-bar");
    if (!navbar) return;

    let brand = navbar.querySelector(".custom-zupra-brand");

    if (!brand) {
      const existingHome = findNavbarBrand();
      if (existingHome) {
        brand = existingHome;
      } else {
        brand = document.createElement("a");
        brand.href = "/app";
        const container = navbar.querySelector(".container, .container-fluid") || navbar;
        container.insertBefore(brand, container.firstChild);
      }
    }

    brand.classList.add(brandClass);
    brand.setAttribute("aria-label", "Zupra Tech");
    brand.setAttribute("href", "/app");

    const currentLogo = brand.querySelector(".custom-zupra-brand-logo");
    const currentName = brand.querySelector(".custom-zupra-brand-name");

    if (!currentLogo || !currentName || currentName.textContent.trim() !== "Zupra Tech") {
      brand.innerHTML = [
        '<img class="custom-zupra-brand-logo" src="/assets/product_customization/images/zupra_logo.png" alt="Zupra Tech" aria-hidden="true">',
        '<span class="custom-zupra-brand-name">Zupra Tech</span>',
      ].join("");
    }
  }

  function fixSearchBar() {
    const searchInputs = document.querySelectorAll(".navbar input, #navbar-search, .search-bar input, .navbar-search input, .awesomplete input");
    searchInputs.forEach((input) => {
      if (input.style.paddingLeft !== "36px") {
        input.style.setProperty("padding-left", "36px", "important");
      }
    });
  }

  function positionBreadcrumbs() {
    const navbar = document.querySelector(".navbar, .navbar-default, .top-bar");
    if (!navbar) return;

    const breadcrumbsSelectors = [
      "#navbar-breadcrumbs",
      ".navbar-breadcrumbs",
      ".navbar-left",
      ".navbar-nav.navbar-left",
      "ul.breadcrumb",
      ".navbar .breadcrumb",
    ];

    breadcrumbsSelectors.forEach((selector) => {
      const elements = navbar.querySelectorAll(selector);
      elements.forEach((el) => {
        if (!el.classList.contains("custom-zupra-brand")) {
          el.style.setProperty("position", "absolute", "important");
          el.style.setProperty("left", "300px", "important");
          el.style.setProperty("top", "50%", "important");
          el.style.setProperty("transform", "translateY(-50%)", "important");
          el.style.setProperty("margin", "0", "important");
          el.style.setProperty("z-index", "10", "important");
        }
      });
    });
  }

  const keywordIcons = {
    item: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
    customer: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    supplier: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
    invoice: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    sales: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
    order: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
    accounting: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
    chart: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    stock: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
    warehouse: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M3 7v14"></path><path d="M21 7v14"></path><path d="M3 7l9-4 9 4"></path></svg>',
    lead: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    crm: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>',
    company: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    brand: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
    leaderboard: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
    territory: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    buying: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path></svg>',
    uom: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>',
    reconciliation: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
    default: '<svg class="custom-tile-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
  };

  function getIconForText(text) {
    const lower = String(text || "").toLowerCase();
    for (const key of Object.keys(keywordIcons)) {
      if (key !== "default" && lower.includes(key)) {
        return keywordIcons[key];
      }
    }
    return keywordIcons.default;
  }

  function injectTileIcons() {
    // 1. Shortcuts under "Your Shortcuts"
    const shortcutBoxes = document.querySelectorAll(".shortcut-widget-box, .widget:has(.shortcut-widget-box)");
    shortcutBoxes.forEach((box) => {
      const link = box.querySelector("a") || box;
      const labelEl = box.querySelector(".widget-title, .widget-label, .shortcut-title") || link;
      const text = (labelEl.textContent || "").trim();

      if (!text || box.querySelector(".custom-tile-icon")) return;

      const iconSvg = getIconForText(text);
      const tempWrapper = document.createElement("span");
      tempWrapper.className = "custom-tile-icon-wrapper";
      tempWrapper.innerHTML = iconSvg;

      if (link.firstChild) {
        link.insertBefore(tempWrapper, link.firstChild);
      } else {
        link.appendChild(tempWrapper);
      }
    });

    // 2. Links inside cards (Reports & Masters, Data Import & Settings, etc.)
    const linkItems = document.querySelectorAll(".links-widget-box a, .report-widget-box a, .workspace-section .link-item");
    linkItems.forEach((link) => {
      const text = (link.textContent || "").trim();
      if (!text || link.querySelector(".custom-tile-icon")) return;

      const iconSvg = getIconForText(text);
      const tempWrapper = document.createElement("span");
      tempWrapper.className = "custom-tile-icon-wrapper";
      tempWrapper.innerHTML = iconSvg;

      if (link.firstChild) {
        link.insertBefore(tempWrapper, link.firstChild);
      } else {
        link.appendChild(tempWrapper);
      }
    });
  }

  /* Add stable tile classes after each dynamic workspace render. The selectors
     cover standard Frappe workspaces regardless of the module or route. */
  function enhanceWorkspaceTiles() {
    const getUniversalIcon = (text) => {
      const label = String(text || "").toLowerCase();
      if (/chart of accounts|account|ledger|balance|finance|tax|profit/.test(label)) return ["chart", keywordIcons.chart];
      if (/customer|lead|contact|employee|user|crm/.test(label)) return ["people", keywordIcons.customer];
      if (/supplier|vendor|purchase/.test(label)) return ["supplier", keywordIcons.supplier];
      if (/company|organisation|organization|branch/.test(label)) return ["company", keywordIcons.company];
      if (/warehouse/.test(label)) return ["warehouse", keywordIcons.warehouse];
      if (/stock|inventory|batch|serial/.test(label)) return ["stock", keywordIcons.stock];
      if (/item|product|material|bom/.test(label)) return ["item", keywordIcons.item];
      if (/sales invoice|invoice|receipt|quotation|order|delivery note|payment/.test(label)) return ["invoice", keywordIcons.invoice];
      if (/leaderboard|dashboard|report|analytics|trend/.test(label)) return ["trend", keywordIcons.leaderboard];
      if (/territory|address|location|region/.test(label)) return ["territory", keywordIcons.territory];
      return ["default", keywordIcons.default];
    };

    const decorate = (target, tileClass) => {
      if (!target) return;
      const text = String(target.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return;

      const [iconName, iconMarkup] = getUniversalIcon(text);
      target.classList.add(tileClass);
      let icon = target.querySelector(".custom-tile-icon-wrapper");
      if (!icon) {
        icon = document.createElement("span");
        icon.className = "custom-tile-icon-wrapper";
        icon.setAttribute("aria-hidden", "true");
        target.insertBefore(icon, target.firstChild);
      }
      if (icon && icon.dataset.productTileIcon !== iconName) {
        icon.innerHTML = iconMarkup;
        icon.dataset.productTileIcon = iconName;
      }
    };

    document.querySelectorAll(".shortcut-widget-box").forEach((box) => {
      box.classList.add("product-shortcut-tile");
      decorate(box.querySelector("a") || box, "product-shortcut-content");
    });

    document.querySelectorAll(".links-widget-box a, .report-widget-box a, .workspace-section .link-item").forEach((item) => {
      decorate(item.matches("a") ? item : item.querySelector("a") || item, "product-link-tile");
    });
  }

  function findNavbar() {
    return document.querySelector(".navbar, .navbar-default, .top-bar");
  }

  function findNavbarSearchTarget(navbar) {
    if (!navbar) {
      return null;
    }

    const input = Array.from(navbar.querySelectorAll(
      ".search-bar input, .navbar-search input, .search-box input, input[type='text'][placeholder*='Search'], input[type='search']"
    )).find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return rect.width > 40 && rect.height > 12;
    });

    if (!input) {
      return null;
    }

    return input.closest(".search-bar, .navbar-search, .navbar-search-wrapper, .search-box, form") || input;
  }

  function positionAskZupraButton(button, navbar, searchTarget) {
    const buttonWidth = button.offsetWidth || 108;
    const buttonHeight = button.offsetHeight || 40;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    let left = Math.max(260, Math.min(viewportWidth - buttonWidth - 220, viewportWidth * 0.54));
    let top = 8;

    if (searchTarget) {
      const rect = searchTarget.getBoundingClientRect();

      if (rect.width > 40 && rect.height > 12) {
        left = rect.left - buttonWidth - 16;
        top = rect.top + ((rect.height - buttonHeight) / 2);
      }
    } else if (navbar) {
      const rect = navbar.getBoundingClientRect();
      top = rect.top + ((Math.max(rect.height, 48) - buttonHeight) / 2);
    }

    left = Math.max(260, Math.min(left, viewportWidth - buttonWidth - 180));
    top = Math.max(6, top);

    if (viewportWidth < 768) {
      left = Math.max(12, viewportWidth - buttonWidth - 12);
      top = 8;
    }

    button.style.setProperty("--custom-ask-zupra-left", `${Math.round(left)}px`);
    button.style.setProperty("--custom-ask-zupra-top", `${Math.round(top)}px`);
  }

  function createAskZupraButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = askZupraButtonClass;
    button.textContent = "Ask Zupra";
    button.setAttribute("aria-controls", askZupraPopupId);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open Ask Zupra chatbot");

    bindAskZupraButton(button);

    return button;
  }

  function bindAskZupraButton(button) {
    if (!button || button.dataset.askZupraMainBound) {
      return;
    }

    button.dataset.askZupraMainBound = "1";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const popup = ensureAskZupraPopup();
      setAskZupraOpen(popup.hidden);
    });
  }

  function ensureAskZupraButton() {
    const navbar = findNavbar();

    if (!navbar) {
      return;
    }

    const button = document.querySelector(`.${askZupraButtonClass}`) || createAskZupraButton();
    const searchTarget = findNavbarSearchTarget(navbar);

    bindAskZupraButton(button);

    if (button.parentElement !== document.body) {
      document.body.appendChild(button);
    }

    positionAskZupraButton(button, navbar, searchTarget);
    document.body.classList.add("custom-ask-zupra-ready");
  }

  function getAskZupraPageTitle() {
    return (
      getTitleText(getTitleArea())?.textContent ||
      document.querySelector(".page-title, .title-text, h1")?.textContent ||
      "this page"
    ).trim();
  }

  function getSidebarItems() {
    return Array.from(document.querySelectorAll(".layout-side-section a, .desk-sidebar a, .standard-sidebar a"))
      .map((anchor) => (anchor.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .filter((value, index, items) => items.indexOf(value) === index)
      .slice(0, 8);
  }

  function getAskZupraRoute() {
    if (window.frappe && typeof frappe.get_route === "function") {
      const route = frappe.get_route();
      return Array.isArray(route) ? route.join("/") : String(route || "");
    }

    return `${window.location.pathname || ""}${window.location.hash || ""}`;
  }

  function getAskZupraServerAnswer(question) {
    if (!window.frappe || typeof frappe.call !== "function") {
      return Promise.resolve("Live ZupraTech data is not available on this page yet. Please refresh the desk and ask again.");
    }

    return new Promise((resolve) => {
      let isSettled = false;

      const finish = (answer) => {
        if (isSettled) {
          return;
        }

        isSettled = true;
        resolve(answer || "The live answer service did not return a response. Please ask again.");
      };

      frappe.call({
        method: "product_customization.chatbot.ask",
        args: {
          question,
          route: getAskZupraRoute(),
          page_title: getAskZupraPageTitle(),
          sidebar_items: getSidebarItems().join("\n"),
        },
        freeze: false,
        callback(response) {
          const message = response && response.message;

          if (message && typeof message === "object" && message.answer) {
            finish(message.answer);
            return;
          }

          if (typeof message === "string") {
            finish(message);
            return;
          }

          finish("The live answer service did not return a response. Please ask again.");
        },
        error() {
          finish("I could not reach the live ZupraTech data right now. Please refresh and ask again.");
        },
      });

      setTimeout(() => {
        finish("The live data check is taking longer than expected. Please try the question again.");
      }, 60000);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function formatAskZupraText(text) {
    let safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/\n/g, "<br>");
    return safe;
  }
  function appendAskZupraMessage(sender, text) {
    const popup = ensureAskZupraPopup();
    const messages = popup.querySelector(".custom-ask-zupra-messages");
    const row = document.createElement("div");
    const bubble = document.createElement("div");

    row.className = `custom-ask-zupra-message custom-ask-zupra-message-${sender}`;
    bubble.className = "custom-ask-zupra-bubble";
    bubble.innerHTML = formatAskZupraText(text);
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;

    return row;
  }

  function updateAskZupraMessage(row, text) {
    const popup = ensureAskZupraPopup();
    const bubble = row && row.querySelector(".custom-ask-zupra-bubble");

    if (bubble) {
      bubble.innerHTML = formatAskZupraText(text);
    } else {
      appendAskZupraMessage("bot", text);
    }

    const messages = popup.querySelector(".custom-ask-zupra-messages");
    messages.scrollTop = messages.scrollHeight;
  }

  function formatAskZupraNamePart(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();

    if (!text || text.includes("@")) {
      return "";
    }

    return text.split(" ").map((word) => {
      return word.split("-").map((part) => {
        if (!part) {
          return part;
        }

        const shouldTitleCase = part === part.toLowerCase() || part === part.toUpperCase();

        return shouldTitleCase ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}` : part;
      }).join("-");
    }).join(" ");
  }

  function buildAskZupraUserName(firstName, lastName, fallbackName) {
    const name = [
      formatAskZupraNamePart(firstName),
      formatAskZupraNamePart(lastName),
    ].filter(Boolean).join(" ");

    return name || formatAskZupraNamePart(fallbackName) || "there";
  }

  function getAskZupraBootUserName() {
    const boot = window.frappe?.boot || {};
    const session = window.frappe?.session || {};
    const bootUser = boot.user && typeof boot.user === "object" ? boot.user : {};
    const sessionUser = session.user || boot.user || "";
    const userInfo = boot.user_info && (
      boot.user_info[sessionUser] ||
      boot.user_info[bootUser.name] ||
      boot.user_info[bootUser.email]
    );

    return buildAskZupraUserName(
      bootUser.first_name || userInfo?.first_name,
      bootUser.last_name || userInfo?.last_name,
      userInfo?.full_name || userInfo?.fullname || bootUser.full_name || session.user_fullname
    );
  }

  function getAskZupraCurrentUserFormName() {
    const user = window.frappe?.session?.user || "";
    const form = window.cur_frm;
    const doc = form?.doctype === "User" ? form.doc : null;

    if (!user || !doc || (doc.name !== user && doc.email !== user)) {
      return "";
    }

    return buildAskZupraUserName(doc.first_name, doc.last_name, doc.full_name);
  }

  function setAskZupraGreeting(popup, name) {
    const greeting = popup.querySelector(".custom-ask-zupra-greeting");

    if (greeting) {
      greeting.textContent = `Hi ${name}`;
    }
  }

  function refreshAskZupraGreeting(popup) {
    const formName = getAskZupraCurrentUserFormName();
    const fallbackName = formName || getAskZupraBootUserName();
    const user = window.frappe?.session?.user;

    setAskZupraGreeting(popup, fallbackName);

    if (!user || user === "Guest" || !window.frappe || typeof frappe.call !== "function") {
      return;
    }

    frappe.call({
      method: "product_customization.ask_zupra.get_current_user_name",
      freeze: false,
      callback(response) {
        const userName = buildAskZupraUserName(
          response?.message?.first_name,
          response?.message?.last_name,
          response?.message?.full_name || fallbackName
        );

        setAskZupraGreeting(popup, formName || userName);
      },
      error() {
        setAskZupraGreeting(popup, fallbackName);
      },
    });
  }

  function hasBlockingDialog() {
    return Boolean(
      document.body && (
        document.body.classList.contains("modal-open") ||
        document.querySelector(".modal.show, .modal.in, .modal-backdrop")
      )
    );
  }

  function syncAskZupraDialogState() {
    const blocked = hasBlockingDialog();

    document.body?.classList.toggle("custom-ask-zupra-blocked", blocked);

    if (blocked && !document.getElementById(askZupraPopupId)?.hidden) {
      setAskZupraOpen(false);
    }
  }

  function resetAskZupraPopup(popup) {
    const messages = popup.querySelector(".custom-ask-zupra-messages");
    const input = popup.querySelector(".custom-ask-zupra-input");
    const sendButton = popup.querySelector(".custom-ask-zupra-send");

    if (messages) {
      messages.textContent = "";
      messages.scrollTop = 0;
    }

    if (input) {
      input.value = "";
    }

    if (sendButton) {
      sendButton.disabled = false;
    }

    refreshAskZupraGreeting(popup);
  }

  function setAskZupraOpen(open) {
    const popup = ensureAskZupraPopup();
    const button = document.querySelector(`.${askZupraButtonClass}`);

    if (open && hasBlockingDialog()) {
      syncAskZupraDialogState();
      return;
    }

    if (open) {
      resetAskZupraPopup(popup);
    }

    popup.hidden = !open;
    popup.classList.toggle("is-open", open);

    if (button) {
      button.setAttribute("aria-expanded", String(open));
      button.classList.toggle("is-open", open);
    }

    if (open) {
      setTimeout(() => {
        popup.querySelector(".custom-ask-zupra-input")?.focus();
      }, 50);
    }
  }

  window.customAskZupraOpen = (open = true) => setAskZupraOpen(Boolean(open));

  function submitAskZupraQuestion(event) {
    event.preventDefault();

    const popup = ensureAskZupraPopup();
    const input = popup.querySelector(".custom-ask-zupra-input");
    const sendButton = popup.querySelector(".custom-ask-zupra-send");
    const question = (input.value || "").trim();

    if (!question) {
      return;
    }

    input.value = "";
    appendAskZupraMessage("user", question);
    const pendingMessage = appendAskZupraMessage("bot", "Let me check the live ZupraTech data for that...");

    if (sendButton) {
      sendButton.disabled = true;
    }

    getAskZupraServerAnswer(question)
      .then((answer) => updateAskZupraMessage(pendingMessage, answer))
      .finally(() => {
        if (sendButton) {
          sendButton.disabled = false;
        }

        input.focus();
      });
  }

  function ensureAskZupraPopup() {
    let popup = document.getElementById(askZupraPopupId);

    if (popup) {
      return popup;
    }

    popup = document.createElement("section");
    popup.id = askZupraPopupId;
    popup.className = "custom-ask-zupra-popup";
    popup.hidden = true;
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "false");
    popup.setAttribute("aria-labelledby", "custom-ask-zupra-title");
    popup.innerHTML = [
      '<div class="custom-ask-zupra-header">',
      '<button type="button" class="custom-ask-zupra-close" aria-label="Minimize Ask Zupra">x</button>',
      '<div>',
      '<div id="custom-ask-zupra-title" class="custom-ask-zupra-title">Ask Zupra</div>',
      '<div class="custom-ask-zupra-subtitle">Ask anything about your ERP data</div>',
      '</div>',
      '</div>',
      '<div class="custom-ask-zupra-messages" role="log" aria-live="polite"></div>',
      '<div class="custom-ask-zupra-greeting" aria-live="polite"></div>',
      '<form class="custom-ask-zupra-form">',
      '<textarea class="custom-ask-zupra-input" rows="3" placeholder="Message Ask Zupra for key data insights." aria-label="Ask the question"></textarea>',
      '<button type="submit" class="custom-ask-zupra-send">Send</button>',
      '</form>',
    ].join("");

    document.body.appendChild(popup);
    popup.querySelector(".custom-ask-zupra-close").addEventListener("click", () => setAskZupraOpen(false));
    popup.querySelector(".custom-ask-zupra-form").addEventListener("submit", submitAskZupraQuestion);
    popup.querySelector(".custom-ask-zupra-input").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        submitAskZupraQuestion(event);
      }
    });

    resetAskZupraPopup(popup);

    return popup;
  }

  function normalizeSidebarText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function normalizeSidebarSlug(value) {
    return normalizeSidebarText(value).replace(/\s+/g, "-");
  }

  function isIgnoredSidebarKey(value) {
    return ["app", "desk", "workspace", "workspaces"].includes(value);
  }

  function getCurrentSidebarKeys(titleText) {
    const keys = new Set();
    const add = (value) => {
      const text = normalizeSidebarText(value);
      const slug = normalizeSidebarSlug(value);

      if (text && !isIgnoredSidebarKey(text)) {
        keys.add(text);
      }

      if (slug && !isIgnoredSidebarKey(slug)) {
        keys.add(slug);
      }
    };

    add(titleText);

    window.location.pathname
      .split("/")
      .filter(Boolean)
      .forEach(add);

    const route = window.frappe && typeof frappe.get_route === "function" ? frappe.get_route() : [];
    (Array.isArray(route) ? route : String(route || "").split("/")).forEach(add);

    return keys;
  }

  function getAnchorSidebarKeys(anchor) {
    const keys = new Set();
    const add = (value) => {
      const text = normalizeSidebarText(value);
      const slug = normalizeSidebarSlug(value);

      if (text && !isIgnoredSidebarKey(text)) {
        keys.add(text);
      }

      if (slug && !isIgnoredSidebarKey(slug)) {
        keys.add(slug);
      }
    };

    add(anchor.textContent);

    try {
      const url = new URL(anchor.getAttribute("href") || "", window.location.origin);
      url.pathname.split("/").filter(Boolean).forEach(add);
    } catch (error) {
      add(anchor.getAttribute("href"));
    }

    return keys;
  }

  function markActiveSidebarItem(titleText) {
    const currentKeys = getCurrentSidebarKeys(titleText);

    document.querySelectorAll(".custom-sidebar-active-item, .custom-sidebar-active-anchor").forEach((element) => {
      element.classList.remove("custom-sidebar-active-item", "custom-sidebar-active-anchor");
    });

    document.querySelectorAll(".layout-side-section.custom-module-side-section a").forEach((anchor) => {
      const anchorKeys = getAnchorSidebarKeys(anchor);
      const isCurrent = Array.from(anchorKeys).some((key) => currentKeys.has(key));

      if (!isCurrent) {
        return;
      }

      const item = anchor.closest(".standard-sidebar-item, .sidebar-item-container, li");

      anchor.classList.add("custom-sidebar-active-anchor");

      if (item) {
        item.classList.add("custom-sidebar-active-item");
      }
    });
  }

  function updateSidebarContext() {
    const isListViewPage = Boolean(
      document.querySelector(".frappe-list, .list-view, .list-row-container, .list-paging-area, .filter-button, .sort-selector")
    );
    const isFormViewPage = Boolean(
      document.querySelector(".form-layout, .form-page, .std-form-layout")
    ) && !isListViewPage;
    const route = window.frappe && typeof frappe.get_route === "function" ? frappe.get_route() : [];
    const routeText = (Array.isArray(route) ? route.join("/") : String(route || "")).toLowerCase();
    const pathText = window.location.pathname.toLowerCase();
    const hashText = window.location.hash.toLowerCase();
    const titleText = (getTitleText(getTitleArea())?.textContent || "").trim().toLowerCase();
    const isQuotationListPage = isListViewPage && (
      routeText.includes("quotation") ||
      pathText.includes("/app/quotation") ||
      hashText.includes("quotation") ||
      titleText === "quotation"
    );

    document.body.classList.toggle("custom-list-view-page", isListViewPage);
    document.body.classList.toggle("custom-form-view-page", isFormViewPage);
    document.body.classList.toggle("custom-quotation-list-page", isQuotationListPage);

    document.querySelectorAll(".layout-side-section").forEach((section) => {
      const sidebarText = (section.textContent || "").toLowerCase();
      const isListSidebar = Boolean(
        section.querySelector(".list-filters, .filter-section, .filter-area, .save-filter-section") ||
        sidebarText.includes("filter by") ||
        sidebarText.includes("save filter")
      );

      section.classList.toggle("custom-list-side-section", isListSidebar);
      section.classList.toggle("custom-module-side-section", !isListSidebar);
    });

    markActiveSidebarItem(titleText);
  }

  function safeRun(fn) {
    try {
      fn();
    } catch (err) {
      console.error("product_customization: error in " + (fn.name || "anonymous"), err);
    }
  }

  function scheduleMove() {
    scheduleTimers.forEach((timer) => clearTimeout(timer));
    scheduleTimers = [0, 100, 300, 700].map((delay) => setTimeout(() => {
      safeRun(moveSidebarToggle);
      safeRun(applyBranding);
      safeRun(ensureAskZupraButton);
      safeRun(ensureAskZupraPopup);
      safeRun(syncAskZupraDialogState);
      safeRun(positionBreadcrumbs);
      safeRun(fixSearchBar);
      safeRun(injectTileIcons);
      safeRun(enhanceWorkspaceTiles);
      safeRun(updateSidebarContext);
    }, delay));
  }

  let enhancementsStarted = false;

  function startThemeEnhancements() {
    if (enhancementsStarted) {
      return;
    }

    if (!document.body) {
      setTimeout(startThemeEnhancements, 50);
      return;
    }

    enhancementsStarted = true;

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !document.getElementById(askZupraPopupId)?.hidden) {
        setAskZupraOpen(false);
      }
    });

    document.addEventListener("DOMContentLoaded", scheduleMove);
    window.addEventListener("hashchange", scheduleMove);
    window.addEventListener("resize", scheduleMove);
    document.addEventListener("page-change", scheduleMove);

    if (window.frappe && frappe.router && frappe.router.on) {
      frappe.router.on("change", scheduleMove);
    }

    new MutationObserver(scheduleMove).observe(document.body, {
      childList: true,
      subtree: true,
    });

    scheduleMove();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startThemeEnhancements, { once: true });
  }

  startThemeEnhancements();
})();
