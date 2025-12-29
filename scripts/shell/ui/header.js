export function createHeaderBar({ title = "", left = [], right = [] } = {}) {
  const header = document.createElement("div");
  header.className = "header-bar";

  const leftSlot = document.createElement("div");
  leftSlot.className = "header-slot header-left";
  const centerSlot = document.createElement("div");
  centerSlot.className = "header-slot header-center";
  const rightSlot = document.createElement("div");
  rightSlot.className = "header-slot header-right";

  if (title) {
    const titleNode = document.createElement("div");
    titleNode.className = "header-title";
    titleNode.textContent = title;
    centerSlot.appendChild(titleNode);
  }
  appendItems(leftSlot, left);
  appendItems(rightSlot, right);

  header.appendChild(leftSlot);
  header.appendChild(centerSlot);
  header.appendChild(rightSlot);

  return { header, leftSlot, centerSlot, rightSlot };
}

export function createIconButton({ label, icon, onClick } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  if (icon) {
    const iconNode = document.createElement("span");
    iconNode.className = "icon-button__icon";
    iconNode.textContent = icon;
    button.appendChild(iconNode);
  }
  if (label) {
    const labelNode = document.createElement("span");
    labelNode.className = "icon-button__label";
    labelNode.textContent = label;
    button.appendChild(labelNode);
  }
  if (typeof onClick === "function") {
    button.addEventListener("click", onClick);
  }
  return button;
}

export function createPill({ label, value, icon } = {}) {
  const pill = document.createElement("div");
  pill.className = "header-pill";
  if (icon) {
    const iconNode = document.createElement("span");
    iconNode.className = "header-pill__icon";
    iconNode.textContent = icon;
    pill.appendChild(iconNode);
  }
  if (label) {
    const labelNode = document.createElement("span");
    labelNode.className = "header-pill__label";
    labelNode.textContent = label;
    pill.appendChild(labelNode);
  }
  if (value !== undefined && value !== null) {
    const valueNode = document.createElement("span");
    valueNode.className = "header-pill__value";
    valueNode.textContent = String(value);
    pill.appendChild(valueNode);
  }
  return pill;
}

export function updatePill(pill, { label, value, icon } = {}) {
  if (!pill) {
    return;
  }
  const labelNode = pill.querySelector(".header-pill__label");
  if (label !== undefined && labelNode) {
    labelNode.textContent = label;
  }
  const valueNode = pill.querySelector(".header-pill__value");
  if (value !== undefined && valueNode) {
    valueNode.textContent = String(value);
  }
  const iconNode = pill.querySelector(".header-pill__icon");
  if (icon !== undefined && iconNode) {
    iconNode.textContent = icon;
  }
}

function appendItems(target, items) {
  if (!Array.isArray(items)) {
    return;
  }
  for (const item of items) {
    if (!item) {
      continue;
    }
    target.appendChild(item);
  }
}
