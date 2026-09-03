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
