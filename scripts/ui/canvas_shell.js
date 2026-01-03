import { ScreenId } from "../shell/index.js";
import { getAppState } from "../shell/app_state.js";

const SHOP_UPGRADES = [
  { title: "Score Multiplier", current: "+0%", next: "+10%", price: "UPGRADE 100" },
  { title: "Coin Multiplier", current: "+0%", next: "+10%", price: "UPGRADE 100" },
  { title: "Bonus Drop Chance", current: "5%", next: "7%", price: "UPGRADE 100" },
  { title: "Bonus Upgrades", current: "Level 0", next: "Details", price: "OPEN" },
];

const SHOP_ITEMS = [
  { title: "Touch-to-Kill", meta: "Consumable", owned: "Owned: 0", price: "BUY 5000" },
  { title: "Machine Gun", meta: "Consumable", owned: "Owned: 0", price: "BUY 5000" },
];

const LEADERBOARD_ROWS = [
  { rank: "1", name: "You", score: "12 450" },
  { rank: "2", name: "Guest_42", score: "10 880" },
  { rank: "3", name: "PlayerX", score: "9 640" },
  { rank: "4", name: "Guest_9", score: "8 210" },
  { rank: "5", name: "Neo", score: "7 980" },
  { rank: "-", name: "You", score: "5 020", highlight: true },
];

export function drawShellUi(ctx, render) {
  const router = getShellRouter();
  if (!router) {
    return;
  }
  const active = router.activeScreen;
  if (!active || active === ScreenId.GAME) {
    syncShellVisibility(false);
    return;
  }
  syncShellVisibility(true);

  const width = render.options.width;
  const height = render.options.height;
  ctx.save();
  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(32, 32, width - 64, height - 64);

  ctx.fillStyle = "#ffffff";
  ctx.font = "28px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const title = getScreenTitle(active);
  ctx.fillText(title, width / 2, 80);

  if (active === ScreenId.HOME) {
    drawHomeScreen(ctx, render);
  }
  if (active === ScreenId.SHOP) {
    drawShopScreen(ctx, render);
  }
  if (active === ScreenId.SETTINGS) {
    drawSettingsScreen(ctx, render);
  }
  if (active === ScreenId.LEADERBOARDS) {
    drawLeaderboardsScreen(ctx, render);
  }
  ctx.restore();
}

export function getShellRouter() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.__shellRouter || null;
}

export function isGameScreenActive() {
  const router = getShellRouter();
  if (!router) {
    return true;
  }
  return router.activeScreen === ScreenId.GAME;
}

export function handleShellPointer(x, y, render) {
  const router = getShellRouter();
  if (!router) {
    return false;
  }
  if (router.activeScreen === ScreenId.HOME) {
    const layout = lastLayout.home;
    if (layout?.play && pointInRect(x, y, layout.play)) {
      if (typeof window !== "undefined" && window.__canvasStartGame) {
        window.__canvasStartGame();
      }
      return true;
    }
    if (layout?.footer) {
      if (layout.footer.shop && pointInRect(x, y, layout.footer.shop)) {
        router.showScreen(ScreenId.SHOP);
        return true;
      }
      if (layout.footer.leaders && pointInRect(x, y, layout.footer.leaders)) {
        router.showScreen(ScreenId.LEADERBOARDS);
        return true;
      }
      if (layout.footer.settings && pointInRect(x, y, layout.footer.settings)) {
        router.showScreen(ScreenId.SETTINGS);
        return true;
      }
    }
  }
  if (router.activeScreen === ScreenId.SHOP) {
    const layout = lastLayout.shop;
    if (layout?.back && pointInRect(x, y, layout.back)) {
      router.showScreen(ScreenId.HOME);
      return true;
    }
    if (layout?.tabs) {
      if (layout.tabs.upgrades && pointInRect(x, y, layout.tabs.upgrades)) {
        shopState.tab = "upgrades";
        return true;
      }
      if (layout.tabs.items && pointInRect(x, y, layout.tabs.items)) {
        shopState.tab = "items";
        return true;
      }
    }
  }
  if (router.activeScreen === ScreenId.SETTINGS) {
    const layout = lastLayout.settings;
    if (layout?.back && pointInRect(x, y, layout.back)) {
      router.showScreen(ScreenId.HOME);
      return true;
    }
  }
  if (router.activeScreen === ScreenId.LEADERBOARDS) {
    const layout = lastLayout.leaderboards;
    if (layout?.back && pointInRect(x, y, layout.back)) {
      router.showScreen(ScreenId.HOME);
      return true;
    }
    if (layout?.tabs) {
      if (layout.tabs.allTime && pointInRect(x, y, layout.tabs.allTime)) {
        leaderboardsState.tab = "all";
        return true;
      }
      if (layout.tabs.weekly && pointInRect(x, y, layout.tabs.weekly)) {
        leaderboardsState.tab = "weekly";
        return true;
      }
    }
  }
  return false;
}

const lastLayout = {
  home: null,
  shop: null,
  settings: null,
  leaderboards: null,
};
const shopState = {
  tab: "upgrades",
};
const leaderboardsState = {
  tab: "all",
};

function drawHomeScreen(ctx, render) {
  const { width, height } = render.options;
  const safePad = 32;
  const headerY = 48;
  const state = getAppState();
  const coins = state.coins ?? 0;
  const best = state.bestScore ?? 0;
  const user = state.userName || "Guest";

  drawHeader(ctx, width, headerY, safePad, { user, coins, best });

  const playRect = drawPrimaryButton(ctx, width / 2, height * 0.55, 240, 70, "PLAY");
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "16px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Tap bubbles • Make combos", width / 2, playRect.y + playRect.height + 16);

  const footer = drawFooter(ctx, width, height - 90, 260);
  lastLayout.home = { play: playRect, footer };
}

function drawShopScreen(ctx, render) {
  const { width, height } = render.options;
  const pad = 32;
  const headerY = 48;
  const state = getAppState();
  const coins = state.coins ?? 0;

  const backRect = drawBackButton(ctx, pad, headerY, "BACK");
  drawShopHeader(ctx, width, headerY, pad, coins);

  const tabs = drawShopTabs(ctx, width / 2, headerY + 70, shopState.tab);
  const contentTop = headerY + 130;
  drawShopCards(
    ctx,
    pad,
    contentTop,
    width - pad * 2,
    height - contentTop - pad,
    shopState.tab === "items" ? SHOP_ITEMS : SHOP_UPGRADES,
    shopState.tab === "upgrades"
  );

  lastLayout.shop = { back: backRect, tabs };
}

function drawSettingsScreen(ctx, render) {
  const { width } = render.options;
  const pad = 32;
  const headerY = 48;
  const state = getAppState();
  const user = state.userName || "Guest";

  const backRect = drawBackButton(ctx, pad, headerY, "BACK");
  drawSettingsHeader(ctx, width, headerY, pad, user);

  let y = headerY + 90;
  y = drawSettingsSection(ctx, pad, y, width - pad * 2, "Audio", [
    { label: "Music", value: 70, type: "slider" },
    { label: "SFX", value: 80, type: "slider" },
    { label: "Mute", value: false, type: "toggle" },
  ]);
  y = drawSettingsSection(ctx, pad, y + 18, width - pad * 2, "Account", [
    { label: "Status", value: "Guest", type: "info" },
    { label: "Login", value: "LOGIN", type: "action" },
  ]);
  drawSettingsSection(ctx, pad, y + 18, width - pad * 2, "Data", [
    { label: "Reset progress", value: "RESET", type: "action", danger: true },
    { label: "Restore purchases", value: "RESTORE", type: "action" },
  ]);

  lastLayout.settings = { back: backRect };
}

function drawLeaderboardsScreen(ctx, render) {
  const { width, height } = render.options;
  const pad = 32;
  const headerY = 48;
  const state = getAppState();
  const user = state.userName || "Guest";

  const backRect = drawBackButton(ctx, pad, headerY, "BACK");
  drawLeaderboardsHeader(ctx, width, headerY, pad, user);

  const tabs = drawLeaderboardsTabs(ctx, width / 2, headerY + 70, leaderboardsState.tab);
  const listTop = headerY + 120;
  drawLeaderboardsList(
    ctx,
    pad,
    listTop,
    width - pad * 2,
    height - listTop - pad,
    leaderboardsState.tab === "all" ? "ALL-TIME" : "WEEKLY",
    LEADERBOARD_ROWS
  );

  lastLayout.leaderboards = { back: backRect, tabs };
}

function drawLeaderboardsHeader(ctx, width, y, pad, user) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LEADERBOARDS", width / 2, y + 16);

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(width - pad - 20, y + 16, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(user, width - pad - 48, y + 16);
  ctx.restore();
}

function drawLeaderboardsTabs(ctx, cx, y, activeTab) {
  const w = 220;
  const h = 34;
  const gap = 12;
  const leftX = cx - w - gap / 2;
  const rightX = cx + gap / 2;
  const allTime = drawTabButton(ctx, leftX, y, w, h, "ALL-TIME", activeTab === "all");
  const weekly = drawTabButton(ctx, rightX, y, w, h, "WEEKLY", activeTab === "weekly");
  return { allTime, weekly };
}

function drawLeaderboardsList(ctx, x, y, width, height, label, rows) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  roundRect(ctx, x, y, width, height, 16);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + 16, y + 12);

  let rowY = y + 40;
  const rowHeight = 34;
  for (const row of rows) {
    drawLeaderboardRow(ctx, x + 12, rowY, width - 24, rowHeight, row);
    rowY += rowHeight + 6;
  }
  ctx.restore();
}

function drawLeaderboardRow(ctx, x, y, width, height, row) {
  ctx.save();
  ctx.fillStyle = row.highlight
    ? "rgba(95, 227, 255, 0.2)"
    : "rgba(255, 255, 255, 0.08)";
  roundRect(ctx, x, y, width, height, 12);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(String(row.rank), x + 12, y + height / 2);
  ctx.fillText(row.name, x + 48, y + height / 2);
  ctx.textAlign = "right";
  ctx.fillText(row.score, x + width - 12, y + height / 2);
  ctx.restore();
}

function drawSettingsHeader(ctx, width, y, pad, user) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SETTINGS", width / 2, y + 16);

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(width - pad - 20, y + 16, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(user, width - pad - 48, y + 16);
  ctx.restore();
}

function drawSettingsSection(ctx, x, y, width, title, rows) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  roundRect(ctx, x, y, width, 40 + rows.length * 44, 18);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "16px \"RussoOne\", sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, x + 16, y + 22);

  let rowY = y + 44;
  for (const row of rows) {
    drawSettingsRow(ctx, x + 16, rowY, width - 32, row);
    rowY += 40;
  }
  ctx.restore();
  return rowY;
}

function drawSettingsRow(ctx, x, y, width, row) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  roundRect(ctx, x, y, width, 34, 12);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(row.label, x + 12, y + 17);

  if (row.type === "slider") {
    drawSlider(ctx, x + width - 140, y + 12, 120, 10, row.value || 0);
  } else if (row.type === "toggle") {
    drawToggle(ctx, x + width - 60, y + 8, 42, 18, row.value);
  } else if (row.type === "action") {
    drawActionButton(ctx, x + width - 120, y + 6, 100, 24, row.value, row.danger);
  } else {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText(String(row.value), x + width - 12, y + 17);
  }
  ctx.restore();
}

function drawSlider(ctx, x, y, width, height, value) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  const fillWidth = Math.max(0, Math.min(1, value / 100)) * width;
  ctx.fillStyle = "rgba(95, 227, 255, 0.9)";
  roundRect(ctx, x, y, fillWidth, height, height / 2);
  ctx.fill();
  ctx.restore();
}

function drawToggle(ctx, x, y, width, height, on) {
  ctx.save();
  ctx.fillStyle = on ? "rgba(95, 227, 255, 0.7)" : "rgba(255, 255, 255, 0.2)";
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  const knobX = on ? x + width - height + 2 : x + 2;
  ctx.beginPath();
  ctx.arc(knobX + height / 2 - 2, y + height / 2, height / 2 - 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawActionButton(ctx, x, y, w, h, label, danger = false) {
  ctx.save();
  ctx.fillStyle = danger ? "rgba(255, 107, 107, 0.2)" : "rgba(95, 227, 255, 0.2)";
  ctx.strokeStyle = danger ? "rgba(255, 107, 107, 0.8)" : "rgba(95, 227, 255, 0.7)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "11px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
}

function drawShopHeader(ctx, width, y, pad, coins) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SHOP", width / 2, y + 16);
  drawPill(ctx, width - pad - 120, y, 120, 36, "Coins", coins);
  ctx.restore();
}

function drawBackButton(ctx, x, y, label) {
  const w = 96;
  const h = 32;
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
  return { x, y, width: w, height: h };
}

function drawShopTabs(ctx, cx, y, activeTab) {
  const w = 240;
  const h = 34;
  const gap = 12;
  const leftX = cx - w - gap / 2;
  const rightX = cx + gap / 2;
  const upgrades = drawTabButton(ctx, leftX, y, w, h, "UPGRADES", activeTab === "upgrades");
  const items = drawTabButton(ctx, rightX, y, w, h, "ITEMS", activeTab === "items");
  return { upgrades, items };
}

function drawTabButton(ctx, x, y, w, h, label, active) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  ctx.strokeStyle = active ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = active ? 2 : 1.5;
  ctx.stroke();
  ctx.fillStyle = active ? "#ffffff" : "rgba(255, 255, 255, 0.7)";
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
  return { x, y, width: w, height: h };
}

function drawShopCards(ctx, x, y, width, height, cards, showNext) {
  const cols = 1;
  const gap = 16;
  const cardHeight = 86;
  const maxCards = Math.floor((height + gap) / (cardHeight + gap));
  ctx.save();
  ctx.font = "14px \"RussoOne\", sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (let i = 0; i < Math.min(cards.length, maxCards); i += 1) {
    const card = cards[i];
    const cardY = y + i * (cardHeight + gap);
    roundRect(ctx, x, cardY, width, cardHeight, 16);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(card.title, x + 16, cardY + 12);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const meta = showNext
      ? `${card.current} -> ${card.next}`
      : card.meta || card.owned || "";
    ctx.fillText(meta, x + 16, cardY + 36);
    if (!showNext && card.owned) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText(card.owned, x + 16, cardY + 56);
    }

    drawActionButton(ctx, x + width - 140, cardY + 24, 120, 38, card.price);
  }
  ctx.restore();
}

function drawHeader(ctx, width, y, pad, { user, coins, best }) {
  const buttonSize = 40;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(pad + buttonSize / 2, y + buttonSize / 2, buttonSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "14px \"RussoOne\", sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(user, pad + buttonSize + 8, y + buttonSize / 2);

  const pillWidth = 120;
  const pillHeight = 36;
  const gap = 10;
  const bestX = width - pad - pillWidth;
  const coinsX = bestX - gap - pillWidth;
  drawPill(ctx, coinsX, y + 2, pillWidth, pillHeight, "Coins", coins);
  drawPill(ctx, bestX, y + 2, pillWidth, pillHeight, "Best", best);
  ctx.restore();
}

function drawPill(ctx, x, y, w, h, label, value) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 12, y + h / 2);
  ctx.textAlign = "right";
  ctx.fillText(String(value), x + w - 12, y + h / 2);
  ctx.restore();
}

function drawFooter(ctx, width, y, totalWidth) {
  const buttonWidth = totalWidth / 3;
  const buttonHeight = 38;
  const startX = width / 2 - totalWidth / 2;
  const labels = ["SHOP", "LEADERS", "SETTINGS"];
  const rects = {};
  ctx.save();
  ctx.font = "14px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < labels.length; i += 1) {
    const x = startX + i * buttonWidth;
    const rect = { x, y, width: buttonWidth, height: buttonHeight };
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(labels[i], rect.x + rect.width / 2, rect.y + rect.height / 2);
    if (labels[i] === "SHOP") rects.shop = rect;
    if (labels[i] === "LEADERS") rects.leaders = rect;
    if (labels[i] === "SETTINGS") rects.settings = rect;
  }
  ctx.restore();
  return rects;
}

function pointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

function syncShellVisibility(showCanvasShell) {
  if (typeof window === "undefined") {
    return;
  }
  const shellRoot = window.__shellRoot;
  const overlayRoot = window.__overlayRoot;
  if (!shellRoot) {
    return;
  }
  if (showCanvasShell) {
    shellRoot.style.display = "none";
    shellRoot.style.opacity = "0";
    shellRoot.style.pointerEvents = "none";
    if (overlayRoot) {
      overlayRoot.style.display = "none";
      overlayRoot.style.opacity = "0";
      overlayRoot.style.pointerEvents = "none";
    }
  } else {
    shellRoot.style.display = "";
    shellRoot.style.opacity = "";
    shellRoot.style.pointerEvents = "";
    if (overlayRoot) {
      overlayRoot.style.display = "";
      overlayRoot.style.opacity = "";
      overlayRoot.style.pointerEvents = "";
    }
  }
}

function getScreenTitle(screenId) {
  if (screenId === ScreenId.SHOP) {
    return "SHOP";
  }
  if (screenId === ScreenId.SETTINGS) {
    return "SETTINGS";
  }
  if (screenId === ScreenId.LEADERBOARDS) {
    return "LEADERBOARDS";
  }
  return "HOME";
}

function drawPrimaryButton(ctx, cx, cy, width, height, label) {
  const x = cx - width / 2;
  const y = cy - height / 2;
  const radius = Math.min(24, height / 2);
  ctx.save();
  ctx.fillStyle = "#5fe3ff";
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.fillStyle = "#0b0d12";
  ctx.font = "24px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy);
  ctx.restore();
  return { x, y, width, height };
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
