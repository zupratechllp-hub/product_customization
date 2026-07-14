(function () {
  const titleToggleClass = "custom-title-sidebar-toggle";
  const originalToggleClass = "custom-original-sidebar-toggle";
  const brandClass = "custom-zupra-brand";
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
    const brand = document.querySelector(".navbar .navbar-brand, .navbar-brand, .navbar-home");
    if (brand) {
      return brand;
    }

    const logo = document.querySelector(".navbar .app-logo, .app-logo");
    return logo && (logo.closest("a, .navbar-brand, .navbar-home, .navbar-header, .navbar-left") || logo.parentElement);
  }

  function applyBranding() {
    const brand = findNavbarBrand();

    if (!brand) {
      return;
    }

    brand.classList.add(brandClass);
    brand.setAttribute("aria-label", "ZupraTech");
    brand.innerHTML = [
      '<img class="custom-zupra-brand-logo" src="/assets/product_customization/images/zupra_logo.png" alt="ZupraTech" aria-hidden="true">',
      '<span class="custom-zupra-brand-name">ZupraTech</span>',
    ].join("");
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

  function scheduleMove() {
    scheduleTimers.forEach((timer) => clearTimeout(timer));
    scheduleTimers = [0, 100, 300, 700].map((delay) => setTimeout(() => {
      moveSidebarToggle();
      applyBranding();
      updateSidebarContext();
    }, delay));
  }

  document.addEventListener("DOMContentLoaded", scheduleMove);
  window.addEventListener("hashchange", scheduleMove);
  document.addEventListener("page-change", scheduleMove);

  if (window.frappe && frappe.router && frappe.router.on) {
    frappe.router.on("change", scheduleMove);
  }

  new MutationObserver(scheduleMove).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
