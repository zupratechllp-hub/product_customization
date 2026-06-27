(function () {
  const titleToggleClass = "custom-title-sidebar-toggle";
  const originalToggleClass = "custom-original-sidebar-toggle";
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

  function scheduleMove() {
    scheduleTimers.forEach((timer) => clearTimeout(timer));
    scheduleTimers = [0, 100, 300, 700].map((delay) => setTimeout(moveSidebarToggle, delay));
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
