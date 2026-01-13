import { ScreenId } from "../shell/index.js";
import { getAppState, setAppState } from "../shell/app_state.js";
import { getAudioSettings, setAudioSettings } from "../audio/index.js";
import {
  FLOOR_THICKNESS,
  GLASS_HEIGHT,
  GLASS_WIDTH,
  WALL_THICKNESS,
} from "../config.js";
import { getGlassFrame } from "./layout.js";
import { formatNumber } from "./format.js";
import {
  BONUS_DROP_LEVELS,
  BONUS_UPGRADE_LEVELS,
  COIN_MULTIPLIER_LEVELS,
  REAL_MONEY_ITEMS,
  SCORE_MULTIPLIER_LEVELS,
  SHOP_ITEMS,
  UPGRADE_TYPES,
  getUpgradePrice,
} from "../shop/model.js";
import {
  applyShopReward,
  canContinueRun,
  canShowAds,
  getAdsState,
  getContinueLabel,
  getContinuePercent,
  incrementContinueCount,
  getShopRewardStatus,
  incrementSessionCount,
  markInterstitialShown,
  playInterstitial,
  playRewarded,
  resetContinueCount,
} from "../ads/index.js";
import {
  getMaxUpgradeLevel,
  getShopProgress,
  tryBuyItem,
  tryBuyRealMoneyItem,
  tryBuyUpgrade,
  updateShopProgress,
} from "../shop/progression.js";
import { loadBonusInventory, saveBonusInventory, saveCoins } from "../game/storage.js";
import { addTotalSpentCoins } from "../ads/runtime.js";
import { applyContinueCleanup } from "../game/continue_cleanup.js";

const LEADERBOARD_ROWS = [
  { rank: 1, name: "You", score: 12450 },
  { rank: 2, name: "Guest_42", score: 10880 },
  { rank: 3, name: "PlayerX", score: 9640 },
  { rank: 4, name: "Guest_9", score: 8210 },
  { rank: 5, name: "Neo", score: 7980 },
  { rank: "-", name: "You", score: 5020, highlight: true },
];

export function drawShellUi(ctx, render, getGlassRect) {
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
  if (active === ScreenId.HOME) {
    const capsule = getCapsuleLayout(render, getGlassRect);
    if (capsule) {
      drawGlobalDim(ctx, width, height);
      drawHomeScreen(ctx, render, capsule);
      ctx.restore();
      return;
    }
  }
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
    drawHomeScreen(ctx, render, null);
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
      router.back?.();
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
    if (layout?.actions) {
      const action = layout.actions.find((entry) => pointInRect(x, y, entry.rect));
      if (action) {
        handleShopAction(action);
        return true;
      }
    }
  }
  if (router.activeScreen === ScreenId.SETTINGS) {
    const layout = lastLayout.settings;
    if (layout?.back && pointInRect(x, y, layout.back)) {
      router.back?.();
      return true;
    }
    if (layout?.audio) {
      const audio = layout.audio;
      if (audio.music && pointInRect(x, y, audio.music)) {
        const value = sliderValueAt(audio.music, x);
        setAudioSettings({ music: value });
        return true;
      }
      if (audio.sfx && pointInRect(x, y, audio.sfx)) {
        const value = sliderValueAt(audio.sfx, x);
        setAudioSettings({ sfx: value });
        return true;
      }
      if (audio.mute && pointInRect(x, y, audio.mute)) {
        const current = getAudioSettings();
        setAudioSettings({ mute: !current.mute });
        return true;
      }
    }
  }
  if (router.activeScreen === ScreenId.LEADERBOARDS) {
    const layout = lastLayout.leaderboards;
    if (layout?.back && pointInRect(x, y, layout.back)) {
      router.back?.();
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

export function drawCanvasModals(ctx, render, getGlassRect, state) {
  const capsule = getCapsuleLayout(render, getGlassRect);
  if (!capsule) {
    return;
  }
  const router = getShellRouter();
  const isGameScreen = router?.activeScreen === ScreenId.GAME;
  resetModalLayout();
  const confirmState = getCanvasConfirmState();
  if (confirmState?.open) {
    drawConfirmModal(ctx, capsule, confirmState);
    return;
  }
  if (isGameScreen && state?.gameOver) {
    if (shouldShowGameOverMenu(state)) {
      drawGameOverModal(ctx, capsule, state);
    }
    return;
  }
  if (isGameScreen && state?.paused && state.pausedReason === "manual") {
    drawPauseModal(ctx, capsule);
  }
}

export function handleCanvasModalPointer(x, y, render, state) {
  const modal = lastLayout.modals;
  const confirmState = getCanvasConfirmState();
  const router = getShellRouter();
  const isGameScreen = router?.activeScreen === ScreenId.GAME;
  if (confirmState?.open && modal?.confirm) {
    handleConfirmPointer(x, y, confirmState, modal.confirm);
    return true;
  }
  if (isGameScreen && state?.gameOver && modal?.gameover) {
    handleGameOverPointer(x, y, state, modal.gameover);
    return true;
  }
  if (isGameScreen && state?.paused && state.pausedReason === "manual" && modal?.pause) {
    handlePausePointer(x, y, modal.pause);
    return true;
  }
  return false;
}

const lastLayout = {
  home: null,
  shop: null,
  settings: null,
  leaderboards: null,
  modals: {
    pause: null,
    gameover: null,
    confirm: null,
  },
};
const shopState = {
  tab: "upgrades",
};
const leaderboardsState = {
  tab: "all",
};
const shopActions = [];
const MODAL_DELAY_MS = 2000;
const confirmState = {
  open: false,
  titleText: "",
  bodyText: "",
  onConfirm: null,
  onCancel: null,
};

function drawHomeScreen(ctx, render, capsule) {
  if (!capsule) {
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
    return;
  }

  const state = getAppState();
  const coins = state.coins ?? 0;
  const best = state.bestScore ?? 0;
  const user = state.userName || "Guest";
  const { inner } = capsule;
  const chipHeight = clamp(inner.height * 0.06, 28, 48);
  const profileY = inner.y - 52;

  drawCapsuleTint(ctx, inner);
  drawProfileChip(ctx, inner.x - 40, profileY, chipHeight, user);
  drawPrismTitle(ctx, inner, "COSMIX");
  const chipWidth = clamp(inner.width * 0.26, 120, 170);
  const coinsX = inner.x + inner.width - chipWidth + 40;
  drawCoinChip(ctx, coinsX, profileY, chipWidth, chipHeight, coins);
  const bestY = inner.y + inner.height * 0.15;
  const bestX = inner.x + (inner.width - chipWidth) / 2;
  drawHudChip(ctx, bestX, bestY, chipWidth, chipHeight, "Best", best);

  const playY = inner.y + inner.height * 0.65;
  const playWidth = inner.width * 0.6;
  const playHeight = clamp(inner.height * 0.1, 52, 72);
  const playRect = drawPrismPrimaryButton(
    ctx,
    inner.x + inner.width / 2,
    playY,
    playWidth,
    playHeight,
    "PLAY",
    getUiButtonImage("play")
  );
  drawSubtext(
    ctx,
    inner,
    inner.x + inner.width / 2,
    playRect.y + playRect.height + inner.height * 0.035
  );

  const panelHeight = clamp(inner.height * 0.09, 44, 64);
  const panelWidth = inner.width * 0.88;
  const panelY = inner.y + inner.height - panelHeight - inner.height * 0.02;
  const footer = drawBottomPanel(
    ctx,
    inner.x + (inner.width - panelWidth) / 2,
    panelY,
    panelWidth,
    panelHeight
  );

  lastLayout.home = { play: playRect, footer };
}

function resetModalLayout() {
  lastLayout.modals.pause = null;
  lastLayout.modals.gameover = null;
  lastLayout.modals.confirm = null;
}

function shouldShowGameOverMenu(state) {
  if (!state?.gameOver) {
    return false;
  }
  const now = getNowMs();
  const startedAt = state.gameOverAtMs || 0;
  return now - startedAt >= MODAL_DELAY_MS;
}

function drawShopScreen(ctx, render) {
  const { width, height } = render.options;
  const pad = 32;
  const headerY = 48;
  const state = getAppState();
  const coins = state.coins ?? 0;
  const progress = getShopProgress();
  const inventory = loadBonusInventory();

  const backRect = drawBackButton(ctx, pad, headerY, "BACK");
  drawShopHeader(ctx, width, headerY, pad, coins);

  const tabs = drawShopTabs(ctx, width / 2, headerY + 70, shopState.tab);
  const contentTop = headerY + 130;
  const upgrades = buildUpgradeCards(progress, coins);
  const items = buildItemCards(progress, inventory, coins);
  resetShopActions();
  drawShopCards(
    ctx,
    pad,
    contentTop,
    width - pad * 2,
    height - contentTop - pad,
    shopState.tab === "items" ? items : upgrades,
    shopState.tab === "upgrades"
  );
  lastLayout.shop = {
    back: backRect,
    tabs,
    actions: getActionRects(),
  };
}

function buildUpgradeCards(progress, coins) {
  const upgrades = [
    {
      id: UPGRADE_TYPES.SCORE_MULTIPLIER,
      title: "Score Multiplier",
      levels: SCORE_MULTIPLIER_LEVELS,
      formatter: (value) => `+${Math.round((value - 1) * 100)}%`,
    },
    {
      id: UPGRADE_TYPES.COIN_MULTIPLIER,
      title: "Coin Multiplier",
      levels: COIN_MULTIPLIER_LEVELS,
      formatter: (value) => `+${Math.round((value - 1) * 100)}%`,
    },
    {
      id: UPGRADE_TYPES.BONUS_DROP,
      title: "Bonus Drop Chance",
      levels: BONUS_DROP_LEVELS,
      formatter: (value) => `${Math.round(value * 100)}%`,
    },
    {
      id: UPGRADE_TYPES.BONUS_UPGRADE,
      title: "Bonus Upgrades",
      levels: BONUS_UPGRADE_LEVELS,
      formatter: (value, level) => `Level ${formatNumber(level)}`,
    },
  ];
  return upgrades.map((upgrade) => {
    const level = progress?.upgrades?.[upgrade.id] ?? 0;
    const maxLevel = getMaxUpgradeLevel(upgrade.id);
    const current = upgrade.formatter(upgrade.levels[level] ?? 0, level);
    const nextLevel = Math.min(level + 1, maxLevel);
    const nextValue = upgrade.levels[nextLevel];
    const next =
      level >= maxLevel
        ? "MAX"
        : upgrade.id === UPGRADE_TYPES.BONUS_UPGRADE
          ? BONUS_UPGRADE_LEVELS[nextLevel]?.label || "Next"
          : upgrade.formatter(nextValue ?? 0, nextLevel);
    const priceValue = getUpgradePrice(level);
    const canAfford = Number.isFinite(priceValue) ? coins >= priceValue : false;
    return {
      id: upgrade.id,
      kind: "upgrade",
      title: upgrade.title,
      current,
      next,
      actionLabel:
        level >= maxLevel ? "MAX" : `UPGRADE ${formatNumber(priceValue)}`,
      actionDisabled: level >= maxLevel || !canAfford,
    };
  });
}

function buildItemCards(progress, inventory, coins) {
  const coinLevel = progress?.upgrades?.[UPGRADE_TYPES.COIN_MULTIPLIER] ?? 0;
  const moneyCoef = COIN_MULTIPLIER_LEVELS[coinLevel] ?? 1;
  const rewardStatus = getShopRewardStatus(Date.now(), moneyCoef);
  const rewardLabel = rewardStatus.available
    ? `WATCH AD +${formatNumber(rewardStatus.reward)}`
    : "TRY LATER";
  const rewardMeta = `+${formatNumber(rewardStatus.reward)} coins`;
  const rewardOwned = `${formatNumber(rewardStatus.count)}/${formatNumber(
    rewardStatus.limit
  )} this hour`;
  const cards = [
    {
      id: "rewarded_shop",
      kind: "reward",
      title: "Watch Ad",
      meta: rewardMeta,
      owned: rewardOwned,
      actionLabel: rewardLabel,
      actionDisabled: !rewardStatus.available,
    },
  ];
  cards.push(
    ...SHOP_ITEMS.map((item) => {
      const count = Math.max(0, Math.floor(inventory?.[item.id] || 0));
      const canAfford = coins >= item.cost;
      return {
        id: item.id,
        kind: "item",
        title: item.title,
        meta: "Consumable",
        owned: `Owned: ${formatNumber(count)}`,
        actionLabel: `BUY ${formatNumber(item.cost)}`,
        actionDisabled: !canAfford,
      };
    })
  );

  for (const item of REAL_MONEY_ITEMS) {
    if (item.id === "remove_ads") {
      const owned = Boolean(progress?.removeAds);
      cards.push({
        id: item.id,
        kind: "real",
        title: "Remove Ads",
        meta: "All ads",
        owned: owned ? "Owned" : null,
        actionLabel: owned ? "OWNED" : `BUY ${formatNumber(item.price)} YAN`,
        actionDisabled: owned,
      });
    } else if (item.id === "coins_1000") {
      cards.push({
        id: item.id,
        kind: "real",
        title: "Coins Pack",
        meta: `${formatNumber(1000)} coins`,
        owned: null,
        actionLabel: `BUY ${formatNumber(item.price)} YAN`,
        actionDisabled: false,
      });
    }
  }
  return cards;
}

function handleShopAction(action) {
  if (action.disabled) {
    return;
  }
  const appState = getAppState();
  const progress = getShopProgress();
  const inventory = loadBonusInventory();
  let coins = appState.coins ?? 0;

  if (action.kind === "upgrade") {
    const result = tryBuyUpgrade(progress, action.id, coins);
    if (!result.ok) {
      return;
    }
    coins = result.coins;
    addTotalSpentCoins(result.price || 0);
    const nextProgress = updateShopProgress({
      upgrades: progress.upgrades,
      removeAds: progress.removeAds,
    });
    saveCoins(coins);
    setAppState({ coins });
    applyShopStateToGame({ coins, progress: nextProgress, inventory });
    return;
  }

  if (action.kind === "item") {
    const result = tryBuyItem(progress, action.id, coins, inventory);
    if (!result.ok) {
      return;
    }
    coins = result.coins;
    addTotalSpentCoins(result.item?.cost || 0);
    saveCoins(coins);
    setAppState({ coins });
    if (result.inventory) {
      saveBonusInventory(result.inventory);
      applyShopStateToGame({ coins, progress, inventory: result.inventory });
    }
    return;
  }

  if (action.kind === "real") {
    const result = tryBuyRealMoneyItem(progress, action.id);
    if (!result.ok) {
      return;
    }
    if (result.grant?.key === "coins") {
      coins += result.grant.amount || 0;
      saveCoins(coins);
      setAppState({ coins });
    }
    const nextProgress = updateShopProgress({
      upgrades: progress.upgrades,
      removeAds: progress.removeAds,
    });
    applyShopStateToGame({ coins, progress: nextProgress, inventory });
  }

  if (action.kind === "reward") {
    const coinLevel = progress?.upgrades?.[UPGRADE_TYPES.COIN_MULTIPLIER] ?? 0;
    const moneyCoef = COIN_MULTIPLIER_LEVELS[coinLevel] ?? 1;
    const status = getShopRewardStatus(Date.now(), moneyCoef);
    if (!status.available) {
      return;
    }
    playRewarded().then((ok) => {
      if (!ok) {
        return;
      }
      const now = Date.now();
      applyShopReward(now);
      coins += status.reward;
      saveCoins(coins);
      setAppState({ coins });
      applyShopStateToGame({ coins, progress, inventory });
    });
  }
}

function applyShopStateToGame(payload) {
  if (typeof window === "undefined") {
    return;
  }
  if (typeof window.__applyShopState === "function") {
    window.__applyShopState(payload);
  }
}

function resetShopActions() {
  shopActions.length = 0;
}

function addShopAction(card, rect) {
  shopActions.push({
    id: card.id,
    kind: card.kind,
    rect,
    disabled: card.actionDisabled,
  });
}

function getActionRects() {
  return shopActions;
}

function drawSettingsScreen(ctx, render) {
  const { width } = render.options;
  const pad = 32;
  const headerY = 48;
  const state = getAppState();
  const user = state.userName || "Guest";
  const audio = state.audio || getAudioSettings();

  const backRect = drawBackButton(ctx, pad, headerY, "BACK");
  drawSettingsHeader(ctx, width, headerY, pad, user);

  let y = headerY + 90;
  const audioSection = drawSettingsSection(
    ctx,
    pad,
    y,
    width - pad * 2,
    "Audio",
    [
      { key: "music", label: "Music", value: audio.music ?? 70, type: "slider" },
      { key: "sfx", label: "SFX", value: audio.sfx ?? 80, type: "slider" },
      { key: "mute", label: "Mute", value: audio.mute ?? false, type: "toggle" },
    ],
    { capture: true }
  );
  y = audioSection.endY;
  const accountSection = drawSettingsSection(ctx, pad, y + 18, width - pad * 2, "Account", [
    { label: "Status", value: "Guest", type: "info" },
    { label: "Login", value: "LOGIN", type: "action" },
  ]);
  drawSettingsSection(ctx, pad, accountSection.endY + 18, width - pad * 2, "Data", [
    { label: "Reset progress", value: "RESET", type: "action", danger: true },
    { label: "Restore purchases", value: "RESTORE", type: "action" },
  ]);

  lastLayout.settings = { back: backRect, audio: audioSection.rects };
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
  ctx.fillText(formatValue(row.score), x + width - 12, y + height / 2);
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

function drawSettingsSection(ctx, x, y, width, title, rows, options = {}) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  roundRect(ctx, x, y, width, 40 + rows.length * 44, 18);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  const scale = options.scale || 1;
  ctx.font = `${Math.round(16 * scale)}px "RussoOne", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, x + 16, y + 22);

  const rects = {};
  let rowY = y + 44;
  for (const row of rows) {
    const controlRect = drawSettingsRow(ctx, x + 16, rowY, width - 32, row, scale);
    if (options.capture && row.key && controlRect) {
      rects[row.key] = controlRect;
    }
    rowY += 40;
  }
  ctx.restore();
  return { endY: rowY, rects };
}

function drawSettingsRow(ctx, x, y, width, row, scale = 1) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  roundRect(ctx, x, y, width, 34, 12);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(12 * scale)}px "RussoOne", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(row.label, x + 12, y + 17);

  let controlRect = null;
  if (row.type === "slider") {
    const sliderRect = {
      x: x + width - 140,
      y: y + 12,
      width: 120,
      height: 10,
      type: "slider",
    };
    drawSlider(ctx, sliderRect.x, sliderRect.y, sliderRect.width, sliderRect.height, row.value || 0);
    controlRect = sliderRect;
  } else if (row.type === "toggle") {
    const toggleRect = {
      x: x + width - 60,
      y: y + 8,
      width: 42,
      height: 18,
      type: "toggle",
    };
    drawToggle(ctx, toggleRect.x, toggleRect.y, toggleRect.width, toggleRect.height, row.value);
    controlRect = toggleRect;
  } else if (row.type === "action") {
    drawActionButton(ctx, x + width - 120, y + 6, 100, 24, row.value, row.danger);
  } else {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText(formatValue(row.value), x + width - 12, y + 17);
  }
  ctx.restore();
  return controlRect;
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

function drawActionButton(ctx, x, y, w, h, label, danger = false, disabled = false, scale = 1) {
  ctx.save();
  const baseFill = danger ? "rgba(255, 107, 107, 0.2)" : "rgba(95, 227, 255, 0.2)";
  const baseStroke = danger ? "rgba(255, 107, 107, 0.8)" : "rgba(95, 227, 255, 0.7)";
  ctx.fillStyle = disabled ? "rgba(255, 255, 255, 0.08)" : baseFill;
  ctx.strokeStyle = disabled ? "rgba(255, 255, 255, 0.25)" : baseStroke;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = disabled ? "rgba(255, 255, 255, 0.6)" : "#ffffff";
  const fontSize = Math.max(10, Math.round(h * 0.4 * scale));
  ctx.font = `${fontSize}px "RussoOne", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
  return { x, y, width: w, height: h };
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

    const actionRect = drawActionButton(
      ctx,
      x + width - 140,
      cardY + 24,
      120,
      38,
      card.actionLabel || card.price,
      false,
      card.actionDisabled
    );
    addShopAction(card, actionRect);
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
  ctx.fillText(formatValue(value), x + w - 12, y + h / 2);
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

function sliderValueAt(rect, x) {
  if (!rect || rect.width <= 0) {
    return 0;
  }
  const t = (x - rect.x) / rect.width;
  return Math.max(0, Math.min(100, Math.round(t * 100)));
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

function getCapsuleLayout(render, getGlassRect) {
  const glassGetter =
    getGlassRect ||
    (typeof window !== "undefined" ? window.__getGlassRect : null);
  if (typeof glassGetter !== "function") {
    return null;
  }
  const glass = glassGetter();
  const frame = getGlassFrame(glass);
  const frameScreen = worldRectToScreen(render, frame);
  const innerScreen = worldRectToScreen(render, {
    x: glass.left,
    y: glass.top,
    width: GLASS_WIDTH,
    height: GLASS_HEIGHT,
  });
  const scaleX = frameScreen.width / frame.width;
  const scaleY = frameScreen.height / frame.height;
  return {
    frame: frameScreen,
    inner: innerScreen,
    scaleX,
    scaleY,
    wall: Math.max(1, WALL_THICKNESS * scaleX),
    floor: Math.max(1, FLOOR_THICKNESS * scaleY),
  };
}

function worldRectToScreen(render, rect) {
  const bounds = render.bounds;
  const scaleX = render.options.width / (bounds.max.x - bounds.min.x);
  const scaleY = render.options.height / (bounds.max.y - bounds.min.y);
  return {
    x: (rect.x - bounds.min.x) * scaleX,
    y: (rect.y - bounds.min.y) * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  };
}

function drawGlobalDim(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = "rgba(5, 8, 12, 0.35)";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawCapsuleTint(ctx, inner) {
  ctx.save();
  ctx.fillStyle = "rgba(7, 12, 18, 0.35)";
  ctx.fillRect(inner.x, inner.y, inner.width, inner.height);
  ctx.restore();
}

function drawPrismTitle(ctx, inner, title) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  const fontSize = clamp(inner.height * 0.06, 18, 36);
  ctx.font = `${Math.round(fontSize)}px "RussoOne", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, inner.x + inner.width / 2, inner.y + inner.height * 0.09);
  ctx.restore();
}

function drawSubtext(ctx, inner, x, y) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  const fontSize = clamp(inner.height * 0.022, 11, 16);
  ctx.font = `${Math.round(fontSize)}px "RussoOne", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Tap • Stack • Combo", x, y);
  ctx.restore();
}

function drawPrismPanel(ctx, x, y, width, height, radius, options = {}) {
  const fill = options.fill || "rgba(10, 20, 30, 0.55)";
  const stroke = options.stroke || "rgba(95, 227, 255, 0.6)";
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  roundRect(ctx, x + 1.5, y + 1.5, width - 3, height - 3, Math.max(2, radius - 1));
  ctx.stroke();
  ctx.restore();
}

function drawProfileChip(ctx, x, y, size, label) {
  const chipWidth = clamp(size * 3.6, 120, 180);
  const chipHeight = size;
  drawPrismPanel(ctx, x, y, chipWidth, chipHeight, chipHeight / 2);
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(x + chipHeight / 2, y + chipHeight / 2, chipHeight * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.max(12, Math.round(chipHeight * 0.38))}px "RussoOne", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + chipHeight, y + chipHeight / 2);
  ctx.restore();
}

function drawHudChip(ctx, x, y, width, height, label, value) {
  drawPrismPanel(ctx, x, y, width, height, height / 2, {
    fill: "rgba(12, 18, 26, 0.55)",
    stroke: "rgba(95, 227, 255, 0.45)",
  });
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = `${Math.max(10, Math.round(height * 0.32))}px "RussoOne", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + height * 0.4, y + height / 2);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText(formatValue(value), x + width - height * 0.35, y + height / 2);
  ctx.restore();
}

function drawCoinChip(ctx, x, y, width, height, value) {
  drawPrismPanel(ctx, x, y, width, height, height / 2, {
    fill: "rgba(12, 18, 26, 0.55)",
    stroke: "rgba(95, 227, 255, 0.45)",
  });
  const icon = getCoinIcon();
  const iconSize = Math.round(height * 0.62);
  const iconX = x + height * 0.35;
  const iconY = y + (height - iconSize) / 2;
  if (icon && icon.complete && icon.naturalWidth > 0) {
    ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
  }
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.max(12, Math.round(height * 0.36))}px "RussoOne", sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(formatValue(value), x + width - height * 0.35, y + height / 2);
  ctx.restore();
}

let coinIconImage = null;
const uiButtonImages = new Map();

function getCoinIcon() {
  if (coinIconImage) {
    return coinIconImage;
  }
  if (typeof Image === "undefined") {
    return null;
  }
  coinIconImage = new Image();
  coinIconImage.src = "./assets/scaled/icon-coin.png";
  return coinIconImage;
}

function getUiButtonImage(key) {
  if (uiButtonImages.has(key)) {
    return uiButtonImages.get(key);
  }
  if (typeof Image === "undefined") {
    return null;
  }
  const image = new Image();
  let src = "";
  if (key === "play") src = "./assets/hud/ui_button_play.png";
  if (key === "shop") src = "./assets/hud/ui_button_shop.png";
  if (key === "leaders") src = "./assets/hud/ui_button_leaders.png";
  if (key === "settings") src = "./assets/hud/ui_button_settings.png";
  if (!src) {
    return null;
  }
  image.src = src;
  uiButtonImages.set(key, image);
  return image;
}

function drawPrismPrimaryButton(ctx, cx, cy, width, height, label, sprite) {
  const x = cx - width / 2;
  const y = cy - height / 2;
  const radius = Math.min(height / 2, 26);
  ctx.save();
  const hasSprite = sprite && sprite.complete && sprite.naturalWidth > 0;
  if (!hasSprite) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "rgba(95, 227, 255, 0.45)");
    gradient.addColorStop(1, "rgba(44, 150, 220, 0.6)");
    roundRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (hasSprite) {
    const targetHeight = height * 1.2;
    const scale = targetHeight / sprite.naturalHeight;
    const targetWidth = sprite.naturalWidth * scale;
    ctx.drawImage(
      sprite,
      cx - targetWidth / 2,
      cy - targetHeight / 2,
      targetWidth,
      targetHeight
    );
  } else {
    ctx.fillStyle = "#081018";
    ctx.font = `${Math.max(18, Math.round(height * 0.45))}px "RussoOne", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy);
  }
  ctx.restore();
  return { x, y, width, height };
}

function drawBottomPanel(ctx, x, y, width, height) {
  ctx.save();
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fillStyle = "rgba(8, 14, 22, 0.65)";
  ctx.fill();
  ctx.restore();
  const buttonSize = Math.min(height * 0.72, 44);
  const gap = (width - buttonSize * 3) / 4;
  const labels = ["SHOP", "LEADERS", "SETTINGS"];
  const rects = {};
  for (let i = 0; i < labels.length; i += 1) {
    const bx = x + gap + i * (buttonSize + gap);
    const by = y + (height - buttonSize) / 2;
    const rect = drawIconButton(
      ctx,
      bx,
      by,
      buttonSize,
      labels[i],
      getUiButtonImage(labels[i].toLowerCase())
    );
    if (labels[i] === "SHOP") rects.shop = rect;
    if (labels[i] === "LEADERS") rects.leaders = rect;
    if (labels[i] === "SETTINGS") rects.settings = rect;
  }
  return rects;
}

function drawPauseModal(ctx, capsule) {
  const { inner } = capsule;
  const scale = getModalScale(inner);
  drawModalBackdrop(ctx, inner);
  const panel = drawModalPanel(ctx, inner, 0.82, 0.66);
  drawModalTitle(ctx, panel, "PAUSED", scale);

  const buttonWidth = panel.width * 0.42;
  const buttonHeight = Math.min(44, panel.height * 0.12);
  const gapX = panel.width * 0.06;
  const startX = panel.x + (panel.width - (buttonWidth * 2 + gapX)) / 2;
  const row1Y = panel.y + panel.height * 0.22;
  const row2Y = row1Y + buttonHeight + panel.height * 0.06;

  const resume = drawActionButton(
    ctx,
    startX,
    row1Y,
    buttonWidth,
    buttonHeight,
    "RESUME",
    false,
    false,
    scale
  );
  const restart = drawActionButton(
    ctx,
    startX + buttonWidth + gapX,
    row1Y,
    buttonWidth,
    buttonHeight,
    "RESTART",
    false,
    false,
    scale
  );
  const home = drawActionButton(
    ctx,
    startX,
    row2Y,
    buttonWidth,
    buttonHeight,
    "HOME",
    false,
    false,
    scale
  );
  const shop = drawActionButton(
    ctx,
    startX + buttonWidth + gapX,
    row2Y,
    buttonWidth,
    buttonHeight,
    "SHOP",
    false,
    false,
    scale
  );

  const audioTop = row2Y + buttonHeight + panel.height * 0.08;
  const audioSection = drawSettingsSection(
    ctx,
    panel.x + panel.width * 0.07,
    audioTop,
    panel.width * 0.86,
    "Audio",
    [
      { key: "music", label: "Music", value: getAudioSettings().music ?? 70, type: "slider" },
      { key: "sfx", label: "SFX", value: getAudioSettings().sfx ?? 80, type: "slider" },
      { key: "mute", label: "Mute", value: getAudioSettings().mute ?? false, type: "toggle" },
    ],
    { capture: true, scale }
  );

  lastLayout.modals.pause = {
    resume,
    restart,
    home,
    shop,
    audio: audioSection.rects,
  };
}

function drawGameOverModal(ctx, capsule, state) {
  const { inner } = capsule;
  const scale = getModalScale(inner);
  drawModalBackdrop(ctx, inner);
  const panel = drawModalPanel(ctx, inner, 0.82, 0.68);
  drawModalTitle(ctx, panel, "GAME OVER", scale);

  const scoreY = panel.y + panel.height * 0.2;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = `${Math.round(12 * scale)}px "RussoOne", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SCORE", panel.x + panel.width / 2, scoreY);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(22 * scale)}px "RussoOne", sans-serif`;
  ctx.fillText(formatNumber(state?.score || 0), panel.x + panel.width / 2, scoreY + 24);
  const best = getAppState().bestScore ?? 0;
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = `${Math.round(12 * scale)}px "RussoOne", sans-serif`;
  ctx.fillText("BEST", panel.x + panel.width / 2, scoreY + 54);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(18 * scale)}px "RussoOne", sans-serif`;
  ctx.fillText(formatNumber(best), panel.x + panel.width / 2, scoreY + 76);
  ctx.restore();

  const continueVisible = canShowAds();
  const continueDisabled = !canContinueRun();
  const continueLabel = getContinueLabel();

  const buttonWidth = panel.width * 0.74;
  const buttonHeight = Math.min(44, panel.height * 0.12);
  const buttonX = panel.x + (panel.width - buttonWidth) / 2;
  let buttonY = panel.y + panel.height * 0.56;
  let continueRect = null;
  if (continueVisible) {
    continueRect = drawActionButton(
      ctx,
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      continueLabel,
      false,
      continueDisabled,
      scale
    );
    buttonY += buttonHeight + panel.height * 0.05;
  }

  const rowWidth = panel.width * 0.78;
  const rowHeight = buttonHeight;
  const rowX = panel.x + (panel.width - rowWidth) / 2;
  const gap = rowWidth * 0.06;
  const halfWidth = (rowWidth - gap) / 2;
  const retry = drawActionButton(
    ctx,
    rowX,
    buttonY,
    halfWidth,
    rowHeight,
    "RETRY",
    false,
    false,
    scale
  );
  const home = drawActionButton(
    ctx,
    rowX + halfWidth + gap,
    buttonY,
    halfWidth,
    rowHeight,
    "HOME",
    false,
    false,
    scale
  );
  const shopY = Math.min(
    buttonY + rowHeight + panel.height * 0.04,
    panel.y + panel.height - rowHeight - panel.height * 0.08
  );
  const shop = drawActionButton(
    ctx,
    rowX,
    shopY,
    rowWidth,
    rowHeight,
    "SHOP",
    false,
    false,
    scale
  );

  lastLayout.modals.gameover = {
    continueRect,
    continueVisible,
    continueDisabled,
    retry,
    home,
    shop,
  };
}

function drawConfirmModal(ctx, capsule, confirmState) {
  const { inner } = capsule;
  const scale = getModalScale(inner);
  drawModalBackdrop(ctx, inner);
  const panel = drawModalPanel(ctx, inner, 0.74, 0.46);
  drawModalTitle(ctx, panel, confirmState.titleText || "Confirm", scale);

  const bodyX = panel.x + panel.width * 0.08;
  const bodyY = panel.y + panel.height * 0.26;
  const bodyWidth = panel.width * 0.84;
  const lineHeight = 16 * scale;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = `${Math.round(12 * scale)}px "RussoOne", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  drawWrappedText(ctx, confirmState.bodyText || "", bodyX, bodyY, bodyWidth, lineHeight, 5);
  ctx.restore();

  const buttonWidth = panel.width * 0.36;
  const buttonHeight = Math.min(40, panel.height * 0.18);
  const gap = panel.width * 0.08;
  const btnY = panel.y + panel.height - buttonHeight - panel.height * 0.12;
  const cancel = drawActionButton(
    ctx,
    panel.x + (panel.width - (buttonWidth * 2 + gap)) / 2,
    btnY,
    buttonWidth,
    buttonHeight,
    "CANCEL",
    false,
    false,
    scale
  );
  const confirm = drawActionButton(
    ctx,
    cancel.x + buttonWidth + gap,
    btnY,
    buttonWidth,
    buttonHeight,
    "CONFIRM",
    false,
    false,
    scale
  );

  lastLayout.modals.confirm = { cancel, confirm };
}

function drawModalBackdrop(ctx, inner) {
  ctx.save();
  ctx.fillStyle = "rgba(6, 10, 16, 0.55)";
  ctx.fillRect(inner.x, inner.y, inner.width, inner.height);
  ctx.restore();
}

function drawModalPanel(ctx, inner, widthPct, heightPct) {
  const width = inner.width * widthPct;
  const height = inner.height * heightPct;
  const x = inner.x + (inner.width - width) / 2;
  const y = inner.y + (inner.height - height) / 2;
  drawPrismPanel(
    ctx,
    x,
    y,
    width,
    height,
    Math.min(20, height * 0.12),
    {
      fill: "rgba(10, 18, 28, 0.75)",
      stroke: "rgba(95, 227, 255, 0.4)",
    }
  );
  return { x, y, width, height };
}

function drawModalTitle(ctx, panel, title, scale = 1) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(18 * scale)}px "RussoOne", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, panel.x + panel.width / 2, panel.y + panel.height * 0.12);
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  if (!text) {
    return;
  }
  const words = text.split(/\s+/);
  let line = "";
  let lineCount = 0;
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const width = ctx.measureText(test).width;
    if (width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      lineCount += 1;
      if (maxLines && lineCount >= maxLines) {
        return;
      }
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line && (!maxLines || lineCount < maxLines)) {
    ctx.fillText(line, x, cursorY);
  }
}

function handlePausePointer(x, y, layout) {
  if (!layout) {
    return;
  }
  const handlers = getCanvasHandlers().pause || {};
  if (layout.resume && pointInRect(x, y, layout.resume)) {
    handlers.resume?.();
    return;
  }
  if (layout.restart && pointInRect(x, y, layout.restart)) {
    handlers.restart?.();
    return;
  }
  if (layout.home && pointInRect(x, y, layout.home)) {
    handlers.home?.();
    return;
  }
  if (layout.shop && pointInRect(x, y, layout.shop)) {
    handlers.shop?.();
    return;
  }
  if (layout.audio) {
    const audio = layout.audio;
    if (audio.music && pointInRect(x, y, audio.music)) {
      const value = sliderValueAt(audio.music, x);
      setAudioSettings({ music: value });
      return;
    }
    if (audio.sfx && pointInRect(x, y, audio.sfx)) {
      const value = sliderValueAt(audio.sfx, x);
      setAudioSettings({ sfx: value });
      return;
    }
    if (audio.mute && pointInRect(x, y, audio.mute)) {
      const current = getAudioSettings();
      setAudioSettings({ mute: !current.mute });
    }
  }
}

async function handleGameOverPointer(x, y, state, layout) {
  if (!layout) {
    return;
  }
  const handlers = getCanvasHandlers().gameOver || {};
  if (layout.continueRect && pointInRect(x, y, layout.continueRect)) {
    if (layout.continueDisabled) {
      return;
    }
    if (!canContinueRun()) {
      return;
    }
    const ok = await playRewarded();
    if (!ok) {
      return;
    }
    const percent = getContinuePercent();
    incrementContinueCount();
    const getGlassRect =
      typeof window !== "undefined" ? window.__getGlassRect : null;
    if (state && typeof getGlassRect === "function") {
      applyContinueCleanup(state, percent, getGlassRect);
      state.killTouchMs = 0;
      state.killGraceUntil = state.engine.timing.timestamp + 2500;
      state.gameOver = false;
      state.gameOverHandled = false;
      state.gameOverAtMs = 0;
    }
    if (typeof window !== "undefined") {
      window.__setGameOver?.(false);
      window.__resumeAfterContinue?.();
    }
    return;
  }
  if (layout.retry && pointInRect(x, y, layout.retry)) {
    resetContinueCount();
    const progress = getShopProgress();
    const now = Date.now();
    const adsState = getAdsState();
    const sessionCount = adsState?.sessionCount || 0;
    const lastInterstitialAt = adsState?.lastInterstitialAt || 0;
    const canShowInterstitial =
      !progress?.removeAds &&
      canShowAds() &&
      sessionCount >= 3 &&
      now - lastInterstitialAt >= 180000;
    if (canShowInterstitial) {
      await playInterstitial();
      markInterstitialShown(now);
    }
    incrementSessionCount();
    handlers.retry?.();
    return;
  }
  if (layout.home && pointInRect(x, y, layout.home)) {
    handlers.home?.();
    return;
  }
  if (layout.shop && pointInRect(x, y, layout.shop)) {
    if (state) {
      state.gameOverAtMs = getNowMs() - MODAL_DELAY_MS;
    }
    handlers.shop?.();
  }
}

function handleConfirmPointer(x, y, confirmState, layout) {
  if (!layout) {
    return;
  }
  if (layout.cancel && pointInRect(x, y, layout.cancel)) {
    confirmState.open = false;
    confirmState.onCancel?.();
    confirmState.onConfirm = null;
    confirmState.onCancel = null;
    return;
  }
  if (layout.confirm && pointInRect(x, y, layout.confirm)) {
    confirmState.open = false;
    confirmState.onConfirm?.();
    confirmState.onConfirm = null;
    confirmState.onCancel = null;
  }
}

function getCanvasConfirmState() {
  return confirmState;
}

function openCanvasConfirm({ titleText, bodyText, onConfirm, onCancel } = {}) {
  confirmState.titleText = titleText || "Confirm";
  confirmState.bodyText = bodyText || "";
  confirmState.onConfirm = onConfirm || null;
  confirmState.onCancel = onCancel || null;
  confirmState.open = true;
}

function getCanvasHandlers() {
  if (typeof window === "undefined") {
    return {};
  }
  return window.__canvasModalHandlers || {};
}


function drawIconButton(ctx, x, y, size, label, sprite) {
  ctx.save();
  const hasSprite = sprite && sprite.complete && sprite.naturalWidth > 0;
  if (!hasSprite) {
    drawPrismPanel(ctx, x, y, size, size, Math.min(14, size / 2), {
      fill: "rgba(10, 18, 28, 0.6)",
      stroke: "rgba(255, 255, 255, 0.35)",
    });
  }
  if (hasSprite) {
    const targetSize = size * 1.4;
    const scale = targetSize / sprite.naturalHeight;
    const targetWidth = sprite.naturalWidth * scale;
    const targetHeight = sprite.naturalHeight * scale;
    ctx.drawImage(
      sprite,
      x + size / 2 - targetWidth / 2,
      y + size / 2 - targetHeight / 2,
      targetWidth,
      targetHeight
    );
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.max(10, Math.round(size * 0.22))}px "RussoOne", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + size / 2, y + size / 2);
  }
  ctx.restore();
  return { x, y, width: size, height: size };
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "0";
  }
  if (typeof value === "number") {
    return formatNumber(value);
  }
  if (typeof value === "string") {
    const compact = value.replace(/\s+/g, "");
    if (/^-?\d+(\.\d+)?$/.test(compact)) {
      return formatNumber(Number(compact));
    }
  }
  return String(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

if (typeof window !== "undefined") {
  window.__canvasConfirm = {
    open: openCanvasConfirm,
  };
}

function getNowMs() {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

function getModalScale(inner) {
  return clamp(inner.height / 800, 0.7, 1.2);
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
