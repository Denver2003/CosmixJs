import { subscribeAppState } from "./app_state.js";
import { createHeaderBar, createIconButton, createPill, updatePill } from "./ui/header.js";

const UPGRADE_CARDS = [
  {
    id: "score",
    title: "Score Multiplier",
    current: "+0%",
    next: "+10%",
    price: "UPGRADE 100",
  },
  {
    id: "coins",
    title: "Coin Multiplier",
    current: "+0%",
    next: "+10%",
    price: "UPGRADE 100",
  },
  {
    id: "bonus",
    title: "Bonus Drop Chance",
    current: "5%",
    next: "7%",
    price: "UPGRADE 100",
  },
  {
    id: "bonus_upgrades",
    title: "Bonus Upgrades",
    current: "Level 0",
    next: "Details",
    price: "OPEN",
  },
];

const ITEM_CARDS = [
  {
    id: "touch",
    title: "Touch-to-Kill",
    description: "Consumable",
    owned: "Owned: 0",
    price: "BUY 5000",
  },
  {
    id: "gun",
    title: "Machine Gun",
    description: "Consumable",
    owned: "Owned: 0",
    price: "BUY 5000",
  },
];

export function setupShopScreen(screen, router) {
  if (!screen) {
    return;
  }
  const coinsPill = createPill({ icon: "💰", label: "Coins", value: "0" });
  const header = createHeaderBar({
    left: [
      createIconButton({
        icon: "←",
        label: "Back",
        onClick: () => router.showScreen("home"),
      }),
    ],
    title: "Shop",
    right: [coinsPill],
  });
  screen.headerBar.replaceChildren(header.header);

  const tabs = document.createElement("div");
  tabs.className = "tabs";

  const upgradesTab = createTabButton("UPGRADES", true);
  const itemsTab = createTabButton("ITEMS", false);

  tabs.appendChild(upgradesTab.button);
  tabs.appendChild(itemsTab.button);

  const upgradesContent = document.createElement("div");
  upgradesContent.className = "tab-panel is-active";
  upgradesContent.appendChild(buildCardGrid(UPGRADE_CARDS, true));

  const itemsContent = document.createElement("div");
  itemsContent.className = "tab-panel";
  itemsContent.appendChild(buildCardGrid(ITEM_CARDS, false));

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
