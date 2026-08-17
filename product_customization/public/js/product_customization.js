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

  function scheduleMove() {
    scheduleTimers.forEach((timer) => clearTimeout(timer));
    scheduleTimers = [0, 100, 300, 700].map((delay) => setTimeout(() => {
      moveSidebarToggle();
      applyBranding();
      ensureAskZupraButton();
      ensureAskZupraPopup();
      syncAskZupraDialogState();
      updateSidebarContext();
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
