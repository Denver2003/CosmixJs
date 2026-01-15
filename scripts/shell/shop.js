import { subscribeAppState } from "./app_state.js";
import {
  createHeaderBar,
  createIconButton,
  createPill,
  setIconButtonLabel,
  updatePill,
} from "./ui/header.js";
import { subscribeLanguage, t } from "../ui/i18n.js";

function getUpgradeCards() {
  return [
    {
      id: "score",
      title: t("label.score_multiplier"),
      current: "+0%",
      next: "+10%",
      price: t("button.upgrade", { price: "100" }),
    },
    {
      id: "coins",
      title: t("label.coin_multiplier"),
      current: "+0%",
      next: "+10%",
      price: t("button.upgrade", { price: "100" }),
    },
    {
      id: "bonus",
      title: t("label.bonus_drop"),
      current: "5%",
      next: "7%",
      price: t("button.upgrade", { price: "100" }),
    },
    {
      id: "bonus_upgrades",
      title: t("label.bonus_upgrades"),
      current: t("label.level", { level: "0" }),
      next: t("label.next"),
      price: t("button.open"),
    },
  ];
}

function getItemCards() {
  return [
    {
      id: "touch",
      title: t("item.touch"),
      description: t("label.consumable"),
      owned: t("label.owned_prefix", { count: "0" }),
      price: t("button.buy", { price: "5000" }),
    },
    {
      id: "gun",
      title: t("item.gun"),
      description: t("label.consumable"),
      owned: t("label.owned_prefix", { count: "0" }),
      price: t("button.buy", { price: "5000" }),
    },
  ];
}

export function setupShopScreen(screen, router) {
  if (!screen) {
    return;
  }
  const coinsPill = createPill({ icon: "💰", label: t("label.coins"), value: "0" });
  const backButton = createIconButton({
    icon: "←",
    label: t("nav.back"),
    onClick: () => router.back?.(),
  });
  const header = createHeaderBar({
    left: [backButton],
    title: t("shop.title"),
    right: [coinsPill],
  });
  screen.headerBar.replaceChildren(header.header);

  const tabs = document.createElement("div");
  tabs.className = "tabs";

  const upgradesTab = createTabButton(t("shop.tab.upgrades"), true);
  const itemsTab = createTabButton(t("shop.tab.items"), false);

  tabs.appendChild(upgradesTab.button);
  tabs.appendChild(itemsTab.button);

  const upgradesContent = document.createElement("div");
  upgradesContent.className = "tab-panel is-active";
  upgradesContent.appendChild(buildCardGrid(getUpgradeCards(), true));

  const itemsContent = document.createElement("div");
  itemsContent.className = "tab-panel";
  itemsContent.appendChild(buildCardGrid(getItemCards(), false));

  upgradesTab.button.addEventListener("click", () => {
    setTabActive(upgradesTab, itemsTab, upgradesContent, itemsContent);
  });
  itemsTab.button.addEventListener("click", () => {
    setTabActive(itemsTab, upgradesTab, itemsContent, upgradesContent);
  });

  const content = document.createElement("div");
  content.className = "shop-content";
  content.appendChild(tabs);
  content.appendChild(upgradesContent);
  content.appendChild(itemsContent);

  screen.contentArea.replaceChildren(content);
  screen.footerNav.replaceChildren();

  const headerTitle = header.header.querySelector(".header-title");
  const renderCards = () => {
    upgradesContent.replaceChildren(buildCardGrid(getUpgradeCards(), true));
    itemsContent.replaceChildren(buildCardGrid(getItemCards(), false));
  };
  const applyTranslations = () => {
    setIconButtonLabel(backButton, t("nav.back"));
    updatePill(coinsPill, { label: t("label.coins") });
    if (headerTitle) headerTitle.textContent = t("shop.title");
    upgradesTab.button.textContent = t("shop.tab.upgrades");
    itemsTab.button.textContent = t("shop.tab.items");
    renderCards();
  };

  subscribeLanguage(applyTranslations);
  subscribeAppState((next) => {
    updatePill(coinsPill, { value: next.coins });
  });
}

function createTabButton(label, active) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `tab ${active ? "is-active" : ""}`;
  button.textContent = label;
  return { button };
}

function setTabActive(activeTab, inactiveTab, activePanel, inactivePanel) {
  activeTab.button.classList.add("is-active");
  inactiveTab.button.classList.remove("is-active");
  activePanel.classList.add("is-active");
  inactivePanel.classList.remove("is-active");
}

function buildCardGrid(cards, includeOwned) {
  const grid = document.createElement("div");
  grid.className = "shop-grid";
  for (const card of cards) {
    const item = document.createElement("div");
    item.className = "shop-card";

    const icon = document.createElement("div");
    icon.className = "shop-card__icon";
    icon.textContent = "⬡";

    const info = document.createElement("div");
    info.className = "shop-card__info";
    const title = document.createElement("div");
    title.className = "shop-card__title";
    title.textContent = card.title;
    info.appendChild(title);

    if (includeOwned) {
      const meta = document.createElement("div");
      meta.className = "shop-card__meta";
      meta.textContent = `${card.current} → ${card.next}`;
      info.appendChild(meta);
    } else {
      const meta = document.createElement("div");
      meta.className = "shop-card__meta";
      meta.textContent = card.description || card.owned;
      info.appendChild(meta);
      if (card.owned) {
        const owned = document.createElement("div");
        owned.className = "shop-card__owned";
        owned.textContent = card.owned;
        info.appendChild(owned);
      }
    }

    const action = document.createElement("button");
    action.type = "button";
    action.className = "shop-card__action";
    action.textContent = card.price;

    item.appendChild(icon);
    item.appendChild(info);
    item.appendChild(action);
    grid.appendChild(item);
  }
  return grid;
}
