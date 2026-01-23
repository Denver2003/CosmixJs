import { ScreenId } from "../shell/index.js";
import { getAppState, setAppState } from "../shell/app_state.js";
import { getAudioSettings, setAudioSettings } from "../audio/index.js";
import {
  FLOOR_THICKNESS,
  GLASS_HEIGHT,
  GLASS_WIDTH,
  WALL_THICKNESS,
} from "../config.js";
import { getCapsuleLayout } from "./layout.js";
import { formatNumber } from "./format.js";
import { getLanguage, setLanguage, t } from "./i18n.js";
import { openCanvasConfirmDialog } from "./canvas_overlays.js";
import { refreshAllTimeLeaderboard } from "../leaderboards/index.js";
import {
  BONUS_DROP_LEVELS,
  BONUS_UPGRADE_LEVELS,
  COIN_MULTIPLIER_LEVELS,
  SCORE_MULTIPLIER_LEVELS,
  SHOP_ITEMS,
  UPGRADE_TYPES,
  getUpgradePrice,
} from "../shop/model.js";
import { applyShopReward, getShopRewardStatus, playRewarded } from "../ads/index.js";
import {
  getMaxUpgradeLevel,
  getShopProgress,
  tryBuyItem,
  tryBuyUpgrade,
  updateShopProgress,
} from "../shop/progression.js";
import {
  loadBonusInventory,
  resetTutorialProgress,
  saveBonusInventory,
  saveCoins,
} from "../game/storage.js";
import { addTotalSpentCoins } from "../ads/runtime.js";
import { resetTutorialForRun } from "../game/tutorial.js";
import { queueCloudSave } from "../cloud/index.js";
import { buildCloudPayload } from "../cloud/state.js";
import { requestAuthorization } from "../sdk/auth.js";
import { ensureIapCatalog, purchaseIapItem } from "../shop/iap.js";
import { IAP_PRODUCTS } from "../shop/iap_config.js";


function resetTutorialState() {
  resetTutorialProgress();
  if (typeof window === "undefined") {
    return;
  }
  const state = window.__gameState;
  if (state?.tutorial) {
    state.tutorial.completed = false;
    resetTutorialForRun(state);
  }
}

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
  if (active !== ScreenId.LEADERBOARDS) {
    leaderboardsState.requested = false;
  }

  const width = render.options.width;
  const height = render.options.height;
  ctx.save();
  const capsule = getCapsuleLayout(render, getGlassRect);
  if (capsule) {
    drawGlobalDim(ctx, width, height);
    if (active === ScreenId.HOME) {
      drawHomeScreen(ctx, render, capsule);
      ctx.restore();
      return;
    }
    drawCapsuleTint(ctx, capsule.inner);
    if (active === ScreenId.SHOP) {
      drawShopScreen(ctx, render, capsule);
      ctx.restore();
      return;
    }
    if (active === ScreenId.SETTINGS) {
      drawSettingsScreen(ctx, render, capsule);
      ctx.restore();
      return;
    }
    if (active === ScreenId.LEADERBOARDS) {
      drawLeaderboardsScreen(ctx, render, capsule);
      ctx.restore();
      return;
    }
  }
  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(32, 32, width - 64, height - 64);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const title = getScreenTitle(active);
  drawFittedText(ctx, title, width / 2, 80, {
    size: 28,
    minSize: 16,
    maxWidth: width - 64,
  });

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
    if (layout?.account?.language && pointInRect(x, y, layout.account.language)) {
      const next = getLanguage() === "en" ? "ru" : "en";
      setLanguage(next);
      return true;
    }
    if (layout?.account?.login && pointInRect(x, y, layout.account.login)) {
      requestAuthorization();
      return true;
    }
    if (layout?.actions) {
      if (layout.actions.resetTutorial && pointInRect(x, y, layout.actions.resetTutorial)) {
        openCanvasConfirmDialog({
          titleText: t("confirm.reset_tutorial_title"),
          bodyText: t("confirm.reset_tutorial_body"),
          onConfirm: resetTutorialState,
        });
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
  }
  return false;
}

export function isShellHoverTarget(x, y, render) {
  const router = getShellRouter();
  if (!router) {
    return false;
  }
  if (router.activeScreen === ScreenId.HOME) {
    const layout = lastLayout.home;
    if (layout?.play && pointInRect(x, y, layout.play)) {
      return true;
    }
    if (layout?.footer) {
      if (layout.footer.shop && pointInRect(x, y, layout.footer.shop)) {
        return true;
      }
      if (layout.footer.leaders && pointInRect(x, y, layout.footer.leaders)) {
        return true;
      }
      if (layout.footer.settings && pointInRect(x, y, layout.footer.settings)) {
        return true;
      }
    }
  }
  if (router.activeScreen === ScreenId.SHOP) {
    const layout = lastLayout.shop;
    if (layout?.back && pointInRect(x, y, layout.back)) {
      return true;
    }
    if (layout?.actions) {
      const action = layout.actions.find(
        (entry) => !entry.disabled && pointInRect(x, y, entry.rect)
      );
      if (action) {
        return true;
      }
    }
  }
  if (router.activeScreen === ScreenId.SETTINGS) {
    const layout = lastLayout.settings;
    if (layout?.back && pointInRect(x, y, layout.back)) {
      return true;
    }
    if (layout?.audio) {
      const audio = layout.audio;
      if (audio.music && pointInRect(x, y, audio.music)) {
        return true;
      }
      if (audio.sfx && pointInRect(x, y, audio.sfx)) {
        return true;
      }
      if (audio.mute && pointInRect(x, y, audio.mute)) {
        return true;
      }
    }
    if (layout?.account?.language && pointInRect(x, y, layout.account.language)) {
      return true;
    }
    if (layout?.account?.login && pointInRect(x, y, layout.account.login)) {
      return true;
    }
    if (layout?.actions) {
      if (
        layout.actions.resetTutorial &&
        pointInRect(x, y, layout.actions.resetTutorial)
      ) {
        return true;
      }
    }
  }
  if (router.activeScreen === ScreenId.LEADERBOARDS) {
    const layout = lastLayout.leaderboards;
    if (layout?.back && pointInRect(x, y, layout.back)) {
      return true;
    }
  }
  return false;
}

export function handleShellWheel(x, y, deltaY, render) {
  const router = getShellRouter();
  if (!router || router.activeScreen !== ScreenId.SHOP) {
    return false;
  }
  const layout = lastLayout.shop;
  if (!layout?.scrollRect || !layout.scrollMax) {
    return false;
  }
  const scrollRect = layout.scrollRect;
  const panelRect = layout.panelRect;
  const hasScrollRect = scrollRect && scrollRect.width > 0 && scrollRect.height > 0;
  const inScroll =
    hasScrollRect && pointInRect(x, y, scrollRect)
      ? true
      : panelRect
        ? pointInRect(x, y, panelRect)
        : false;
  if (!inScroll) {
    return false;
  }
  return applyShopScroll(deltaY);
}

export function beginShellDrag(x, y) {
  const router = getShellRouter();
  if (!router || router.activeScreen !== ScreenId.SHOP) {
    return false;
  }
  const layout = lastLayout.shop;
  if (!layout?.scrollRect || !layout.scrollMax) {
    return false;
  }
  const scrollRect = layout.scrollRect;
  const panelRect = layout.panelRect;
  const hasScrollRect = scrollRect && scrollRect.width > 0 && scrollRect.height > 0;
  const inScroll =
    hasScrollRect && pointInRect(x, y, scrollRect)
      ? true
      : panelRect
        ? pointInRect(x, y, panelRect)
        : false;
  if (!inScroll) {
    return false;
  }
  const max = layout.scrollMax.all ?? 0;
  return max > 0;
}

export function updateShellDrag(deltaY) {
  return applyShopScroll(deltaY);
}

const lastLayout = {
  home: null,
  shop: null,
  settings: null,
  leaderboards: null,
};
const shopState = {
  scroll: {
    all: 0,
  },
};
const leaderboardsState = {
  requested: false,
};
const shopActions = [];
const UPGRADE_TITLE_KEYS = {
  [UPGRADE_TYPES.SCORE_MULTIPLIER]: "label.score_multiplier",
  [UPGRADE_TYPES.COIN_MULTIPLIER]: "label.coin_multiplier",
  [UPGRADE_TYPES.BONUS_DROP]: "label.bonus_drop",
  [UPGRADE_TYPES.BONUS_UPGRADE]: "label.bonus_upgrades",
};
const ITEM_TITLE_KEYS = {
  touch: "item.touch",
  gun: "item.gun",
};

function clampShopScroll(tab, max) {
  if (!shopState.scroll) {
    shopState.scroll = { all: 0 };
  }
  const current = shopState.scroll[tab] ?? 0;
  shopState.scroll[tab] = clamp(current, 0, Math.max(0, max));
}

function applyShopScroll(deltaY) {
  const layout = lastLayout.shop;
  if (!layout?.scrollMax) {
    return false;
  }
  const max = layout.scrollMax.all ?? 0;
  if (max <= 0) {
    return false;
  }
  const current = shopState.scroll.all ?? 0;
  const next = clamp(current + deltaY, 0, max);
  if (next === current) {
    return false;
  }
  shopState.scroll.all = next;
  return true;
}
const BONUS_UPGRADE_LABEL_KEYS = [
  "bonus_upgrade.level_0",
  "bonus_upgrade.level_1",
  "bonus_upgrade.level_2",
  "bonus_upgrade.level_3",
  "bonus_upgrade.level_4",
  "bonus_upgrade.level_5",
  "bonus_upgrade.level_6",
  "bonus_upgrade.level_7",
];

function drawHomeScreen(ctx, render, capsule) {
  if (!capsule) {
    const { width, height } = render.options;
    const safePad = 32;
    const headerY = 48;
    const state = getAppState();
    const coins = state.coins ?? 0;
    const best = state.bestScore ?? 0;
    const user = resolveUserLabel(state.userName);

    drawHeader(ctx, width, headerY, safePad, { user, coins, best });

    const playRect = drawPrimaryButton(
      ctx,
      width / 2,
      height * 0.55,
      240,
      70,
      t("nav.play")
    );
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    drawFittedText(ctx, t("home.subtitle_alt"), width / 2, playRect.y + playRect.height + 16, {
      size: 16,
      minSize: 10,
      maxWidth: width * 0.8,
    });

    const footer = drawFooter(ctx, width, height - 90, 260);
    lastLayout.home = { play: playRect, footer };
    return;
  }

  const state = getAppState();
  const coins = state.coins ?? 0;
  const best = state.bestScore ?? 0;
  const user = resolveUserLabel(state.userName);
  const { inner } = capsule;
  const chipHeight = clamp(inner.height * 0.06, 22, 48);
  const profileY = inner.y - chipHeight - inner.height * 0.02;

  drawCapsuleTint(ctx, inner);
  drawProfileChip(ctx, inner.x - 40, profileY, chipHeight, user);
  drawPrismTitle(ctx, inner, t("app.title"));
  const chipWidth = clamp(inner.width * 0.26, 96, 170);
  const coinWidth = clamp(chipWidth * 1.3, chipWidth, inner.width + 80);
  const coinsX = inner.x + inner.width - coinWidth + 40;
  drawCoinChip(ctx, coinsX, profileY, coinWidth, chipHeight, coins);
  const bestY = inner.y + inner.height * 0.15;
  const bestWidth = clamp(chipWidth * 2, chipWidth, inner.width + 80);
  const bestX = inner.x + (inner.width - bestWidth) / 2;
  drawHudChip(ctx, bestX, bestY, bestWidth, chipHeight, t("label.best"), best);

  const playY = inner.y + inner.height * 0.65;
  const playWidth = inner.width * 0.6;
  const playHeight = clamp(inner.height * 0.1, 44, 72);
  const playRect = drawPrismPrimaryButton(
    ctx,
    inner.x + inner.width / 2,
    playY,
    playWidth,
    playHeight,
    t("nav.play"),
    getUiButtonImage("play")
  );
  const subtextSize = Math.max(10, Math.round(14 * getUiScale(inner)));
  drawSubtext(
    ctx,
    inner.x + inner.width / 2,
    playRect.y + playRect.height + inner.height * 0.035,
    subtextSize,
    t("home.subtitle"),
    inner.width * 0.85
  );

  const panelHeight = clamp(inner.height * 0.09, 36, 64);
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

function drawShopScreen(ctx, render, capsule) {
  if (!capsule) {
    const { width, height } = render.options;
    const pad = 32;
    const headerY = 48;
    const state = getAppState();
    const coins = state.coins ?? 0;
    const progress = getShopProgress();
    const inventory = loadBonusInventory();

    const backRect = drawBackButton(ctx, pad, headerY, t("nav.back"));
    drawShopHeader(ctx, width, headerY, pad, coins);

    const contentTop = headerY + 70;
    const contentHeight = height - contentTop - pad;
    const listRect = {
      x: pad,
      y: contentTop,
      width: width - pad * 2,
      height: Math.max(1, contentHeight),
    };
    const listOptions = {
      gap: 16,
      cardHeight: 86,
      fontSize: 14,
      actionWidth: 120,
      actionHeight: 38,
      sectionGap: 18,
      sectionHeaderHeight: 24,
    };
    ensureIapCatalog();
    const sections = buildShopSections({
      progress,
      inventory,
      coins,
      skippers: state.skippers ?? 0,
      allowIap: state.sdkName === "yandex",
      iapCatalog: state.iap?.items || [],
    });
    const sectionHeight = getShopSectionsHeight(sections, listOptions);
    const scrollMax = Math.max(0, sectionHeight - contentHeight);
    clampShopScroll("all", scrollMax);
    resetShopActions();
    drawShopSections(ctx, pad, contentTop, width - pad * 2, sections, {
      ...listOptions,
      scrollOffset: shopState.scroll.all ?? 0,
      clipRect: listRect,
    });
    lastLayout.shop = {
      back: backRect,
      actions: getActionRects(),
      panelRect: { x: pad, y: headerY, width: width - pad * 2, height: height - pad * 2 },
      scrollRect: listRect,
      scrollMax: { all: scrollMax },
    };
    return;
  }

  const { inner } = capsule;
  const scale = getUiScale(inner);
  const state = getAppState();
  const coins = state.coins ?? 0;
  const progress = getShopProgress();
  const inventory = loadBonusInventory();

  const basePanelWidth = inner.width * 0.9;
  const basePanelHeight = inner.height * 0.78;
  const sideBoost = clamp(inner.width * 0.1, 20, 30);
  const upBoost = 80;
  const panelWidth = Math.min(basePanelWidth * 1.2 + sideBoost * 2, inner.width + 80 + sideBoost * 2);
  const panelHeight = Math.min(
    basePanelHeight * 1.3 + upBoost * 2,
    inner.height + 80 + upBoost * 2
  );
  const panelX = clamp(
    inner.x + (inner.width - panelWidth) / 2,
    inner.x - 40 - sideBoost,
    inner.x + inner.width - panelWidth + 40 + sideBoost
  );
  const panelY = clamp(
    inner.y + inner.height * 0.12 - upBoost,
    inner.y - 40 - upBoost,
    inner.y + inner.height - panelHeight + 40 + upBoost
  );
  const radius = Math.min(24, panelHeight * 0.08);
  drawPrismPanel(ctx, panelX, panelY, panelWidth, panelHeight, radius);

  const pad = clamp(panelWidth * 0.04, 8, 20);
  const headerHeight = clamp(48 * scale, 28, 56);
  const backSize = clamp(32 * scale, 20, 36);
  const backRect = drawBackIconButton(
    ctx,
    panelX + pad,
    panelY + pad + (headerHeight - backSize) / 2,
    backSize
  );

  const chipHeight = backSize;
  const chipWidth = clamp(panelWidth * 0.26, 96, 150);
  const coinWidth = clamp(chipWidth * 1.3, chipWidth, panelWidth - pad * 2);
  const titleMaxWidth = Math.max(
    40,
    panelWidth - pad * 2 - backSize - coinWidth - pad
  );
  const titleSize = clamp(Math.round(20 * scale), 12, 22);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, t("shop.title"), panelX + panelWidth / 2, panelY + pad + headerHeight / 2, {
    size: titleSize,
    minSize: Math.max(10, titleSize - 4),
    maxWidth: titleMaxWidth,
  });
  ctx.restore();
  drawCoinChip(
    ctx,
    panelX + panelWidth - pad - coinWidth,
    panelY + pad + (headerHeight - chipHeight) / 2,
    coinWidth,
    chipHeight,
    coins
  );

  const contentTop = panelY + pad + headerHeight + clamp(12 * scale, 6, 14);
  const maxVisibleBottom = Math.min(
    panelY + panelHeight - pad,
    render.options.height - pad
  );
  const contentHeight = Math.max(0, maxVisibleBottom - contentTop);
  const listRect = {
    x: panelX + pad,
    y: contentTop,
    width: panelWidth - pad * 2,
    height: Math.max(1, contentHeight),
  };
  const listOptions = {
    gap: clamp(12 * scale, 6, 14),
    cardHeight: clamp(86 * scale, 60, 96),
    fontSize: clamp(14 * scale, 11, 16),
    actionWidth: clamp(120 * scale, 90, 130),
    actionHeight: clamp(36 * scale, 24, 40),
    sectionGap: clamp(18 * scale, 10, 20),
    sectionHeaderHeight: clamp(28 * scale, 18, 30),
  };
  ensureIapCatalog();
  const sections = buildShopSections({
    progress,
    inventory,
    coins,
    skippers: state.skippers ?? 0,
    allowIap: state.sdkName === "yandex",
    iapCatalog: state.iap?.items || [],
  });
  const sectionHeight = getShopSectionsHeight(sections, listOptions);
  const scrollMax = Math.max(0, sectionHeight - contentHeight);
  clampShopScroll("all", scrollMax);
  resetShopActions();
  drawShopSections(ctx, panelX + pad, contentTop, panelWidth - pad * 2, sections, {
    ...listOptions,
    scrollOffset: shopState.scroll.all ?? 0,
    clipRect: listRect,
  });

  lastLayout.shop = {
    back: backRect,
    actions: getActionRects(),
    panelRect: { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
    scrollRect: listRect,
    scrollMax: { all: scrollMax },
  };
}

function buildUpgradeCards(progress, coins) {
  const upgrades = [
    {
      id: UPGRADE_TYPES.SCORE_MULTIPLIER,
      title: t(UPGRADE_TITLE_KEYS[UPGRADE_TYPES.SCORE_MULTIPLIER]),
      levels: SCORE_MULTIPLIER_LEVELS,
      formatter: (value) => `+${Math.round((value - 1) * 100)}%`,
    },
    {
      id: UPGRADE_TYPES.COIN_MULTIPLIER,
      title: t(UPGRADE_TITLE_KEYS[UPGRADE_TYPES.COIN_MULTIPLIER]),
      levels: COIN_MULTIPLIER_LEVELS,
      formatter: (value) => `+${Math.round((value - 1) * 100)}%`,
    },
    {
      id: UPGRADE_TYPES.BONUS_DROP,
      title: t(UPGRADE_TITLE_KEYS[UPGRADE_TYPES.BONUS_DROP]),
      levels: BONUS_DROP_LEVELS,
      formatter: (value) => `${Math.round(value * 100)}%`,
    },
    {
      id: UPGRADE_TYPES.BONUS_UPGRADE,
      title: t(UPGRADE_TITLE_KEYS[UPGRADE_TYPES.BONUS_UPGRADE]),
      levels: BONUS_UPGRADE_LEVELS,
      formatter: (value, level) => t("label.level", { level: formatNumber(level) }),
    },
  ];
  return upgrades.map((upgrade) => {
    const level = progress?.upgrades?.[upgrade.id] ?? 0;
    const maxLevel = getMaxUpgradeLevel(upgrade.id);
    const progressRatio = maxLevel > 0 ? level / maxLevel : 1;
    const progressPercent = Math.round(Math.max(0, Math.min(1, progressRatio)) * 100);
    const current = upgrade.formatter(upgrade.levels[level] ?? 0, level);
    const nextLevel = Math.min(level + 1, maxLevel);
    const nextValue = upgrade.levels[nextLevel];
    const next =
      level >= maxLevel
        ? t("button.max")
        : upgrade.id === UPGRADE_TYPES.BONUS_UPGRADE
          ? getBonusUpgradeLabel(nextLevel)
          : upgrade.formatter(nextValue ?? 0, nextLevel);
    const priceValue = getUpgradePrice(level);
    const canAfford = Number.isFinite(priceValue) ? coins >= priceValue : false;
    return {
      id: upgrade.id,
      kind: "upgrade",
      title: upgrade.title,
      current,
      next,
      progress: progressRatio,
      progressLabel: `${progressPercent}%`,
      actionLabel:
        level >= maxLevel
          ? t("button.max")
          : t("button.upgrade", { price: formatNumber(priceValue) }),
      actionDisabled: level >= maxLevel || !canAfford,
    };
  });
}

function getBonusUpgradeLabel(level) {
  const key = BONUS_UPGRADE_LABEL_KEYS[level];
  if (key) {
    return t(key);
  }
  return BONUS_UPGRADE_LEVELS[level]?.label || t("label.next");
}

function buildItemCards(progress, inventory, coins) {
  return SHOP_ITEMS.map((item) => {
    const count = Math.max(0, Math.floor(inventory?.[item.id] || 0));
    const canAfford = coins >= item.cost;
    const titleKey = ITEM_TITLE_KEYS[item.id];
    return {
      id: item.id,
      kind: "item",
      title: titleKey ? t(titleKey) : item.title,
      meta: t("label.consumable"),
      owned: t("label.owned_prefix", { count: formatNumber(count) }),
      actionLabel: t("button.buy", { price: formatNumber(item.cost) }),
      actionDisabled: !canAfford,
    };
  });
}

function getIapFallbackTitle(id) {
  if (id === "remove_ads") {
    return t("label.remove_ads");
  }
  if (id === "coins_500") {
    return t("label.coins_pack");
  }
  if (id === "skippers_30") {
    return t("label.skippers_pack");
  }
  return t("label.coins_pack");
}

function getIapFallbackMeta(config) {
  if (!config) {
    return "";
  }
  if (config.id === "remove_ads") {
    return t("label.all_ads");
  }
  if (config.grant?.key === "coins") {
    return t("label.coins_amount", { amount: formatNumber(config.grant.amount || 0) });
  }
  if (config.grant?.key === "skippers") {
    return t("label.skippers");
  }
  return "";
}

function buildInAppCards(progress, skippersCount, catalog) {
  const cards = [];
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return cards;
  }
  const byProductId = new Map();
  if (Array.isArray(catalog)) {
    for (const item of catalog) {
      if (item?.productId) {
        byProductId.set(String(item.productId), item);
      }
    }
  }

  for (const config of IAP_PRODUCTS) {
    const product = byProductId.get(config.productId) || null;
    if (!product) {
      continue;
    }
    const owned = config.id === "remove_ads" ? Boolean(progress?.removeAds) : false;
    const fallbackTitle = getIapFallbackTitle(config.id);
    const fallbackMeta = getIapFallbackMeta(config);
    const title = product?.title || fallbackTitle;
    const meta = product?.description || fallbackMeta;
    const priceLabel = product?.price || "";
    const actionLabel = priceLabel
      ? t("button.buy_price", { price: priceLabel })
      : t("button.buy_now");
    cards.push({
      id: config.id,
      kind: "iap",
      title,
      meta,
      owned: owned
        ? t("label.owned")
        : config.id === "skippers_30" && skippersCount > 0
          ? t("label.owned_prefix", { count: formatNumber(skippersCount) })
          : null,
      actionLabel: owned ? t("button.owned") : actionLabel,
      actionDisabled: owned,
    });
  }
  return cards;
}

function buildRewardCard(progress) {
  const coinLevel = progress?.upgrades?.[UPGRADE_TYPES.COIN_MULTIPLIER] ?? 0;
  const moneyCoef = COIN_MULTIPLIER_LEVELS[coinLevel] ?? 1;
  const rewardStatus = getShopRewardStatus(Date.now(), moneyCoef);
  const rewardLabel = rewardStatus.available
    ? t("button.watch_ad_reward", { reward: formatNumber(rewardStatus.reward) })
    : t("button.try_later");
  return {
    id: "rewarded_shop",
    kind: "reward",
    title: t("label.watch_ad"),
    meta: t("label.reward_meta", { reward: formatNumber(rewardStatus.reward) }),
    owned: t("label.reward_owned", {
      count: formatNumber(rewardStatus.count),
      limit: formatNumber(rewardStatus.limit),
    }),
    actionLabel: rewardLabel,
    actionDisabled: !rewardStatus.available,
  };
}

function buildShopSections({ progress, inventory, coins, skippers, allowIap, iapCatalog }) {
  const sections = [];
  const upgrades = buildUpgradeCards(progress, coins);
  if (upgrades.length) {
    sections.push({
      id: "upgrades",
      title: t("shop.section.upgrades"),
      cards: upgrades,
      showNext: true,
    });
  }
  const bonuses = buildItemCards(progress, inventory, coins);
  if (bonuses.length) {
    sections.push({
      id: "bonuses",
      title: t("shop.section.bonuses"),
      cards: bonuses,
      showNext: false,
    });
  }
  if (allowIap) {
    const inapps = buildInAppCards(progress, skippers, iapCatalog);
    if (inapps.length) {
      sections.push({
        id: "inapps",
        title: t("shop.section.inapps"),
        cards: inapps,
        showNext: false,
      });
    }
  }
  const rewardCard = buildRewardCard(progress);
  sections.push({
    id: "ads",
    title: t("shop.section.ads"),
    cards: [rewardCard],
    showNext: false,
  });
  return sections;
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
    queueCloudSave(buildCloudPayload());
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
    queueCloudSave(buildCloudPayload());
    return;
  }

  if (action.kind === "iap") {
    purchaseIapItem(action.id);
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
      queueCloudSave(buildCloudPayload());
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

function drawSettingsScreen(ctx, render, capsule) {
  if (!capsule) {
    const { width } = render.options;
    const pad = 32;
    const headerY = 48;
    const state = getAppState();
    const user = resolveUserLabel(state.userName);
    const audio = state.audio || getAudioSettings();

    const backRect = drawBackButton(ctx, pad, headerY, t("nav.back"));
    drawSettingsHeader(ctx, width, headerY, pad, user);

    let y = headerY + 90;
    const audioSection = drawSettingsSection(
      ctx,
      pad,
      y,
      width - pad * 2,
      t("label.audio"),
      [
        { key: "music", label: t("label.music"), value: audio.music ?? 70, type: "slider" },
        { key: "sfx", label: t("label.sfx"), value: audio.sfx ?? 80, type: "slider" },
        { key: "mute", label: t("label.mute"), value: audio.mute ?? false, type: "toggle" },
      ],
      { capture: true }
    );
    y = audioSection.endY;
    const showLanguage = state.sdkName !== "yandex";
    const accountRows = [
      { label: t("label.status"), value: resolveUserLabel(state.userName), type: "info" },
      {
        key: "login",
        label: t("label.login"),
        value: t("button.login"),
        type: "action",
      },
    ];
    if (showLanguage) {
      accountRows.push({
        key: "language",
        label: t("label.language"),
        value: getLanguage().toUpperCase(),
        type: "action",
      });
    }
    const accountSection = drawSettingsSection(
      ctx,
      pad,
      y + 18,
      width - pad * 2,
      t("label.account"),
      accountRows,
      { capture: true }
    );
    const dataSection = drawSettingsSection(
      ctx,
      pad,
      accountSection.endY + 18,
      width - pad * 2,
      t("label.data"),
      [
        {
          key: "resetTutorial",
          label: t("label.reset_tutorial"),
          value: t("button.reset"),
          type: "action",
        },
      ],
      { capture: true }
    );

    lastLayout.settings = {
      back: backRect,
      audio: audioSection.rects,
      account: accountSection.rects,
      actions: dataSection.rects,
    };
    return;
  }

  const { inner } = capsule;
  const scale = getUiScale(inner);
  const state = getAppState();
  const user = resolveUserLabel(state.userName);
  const audio = state.audio || getAudioSettings();

  const basePanelWidth = inner.width * 0.9;
  const basePanelHeight = inner.height * 0.78;
  const panelWidth = Math.min(basePanelWidth * 1.2, inner.width + 80);
  const panelHeight = Math.min(basePanelHeight * 1.3, inner.height + 80);
  const panelX = clamp(
    inner.x + (inner.width - panelWidth) / 2,
    inner.x - 40,
    inner.x + inner.width - panelWidth + 40
  );
  const panelY = clamp(
    inner.y + inner.height * 0.12,
    inner.y - 40,
    inner.y + inner.height - panelHeight + 40
  );
  drawPrismPanel(ctx, panelX, panelY, panelWidth, panelHeight, Math.min(24, panelHeight * 0.08));

  const pad = clamp(panelWidth * 0.04, 8, 20);
  const headerHeight = clamp(48 * scale, 28, 56);
  const backSize = clamp(32 * scale, 20, 36);
  const backRect = drawBackIconButton(
    ctx,
    panelX + pad,
    panelY + pad + (headerHeight - backSize) / 2,
    backSize
  );

  const chipHeight = backSize;
  const profileChipWidth = clamp(chipHeight * 3.6, 96, 180);
  const titleMaxWidth = Math.max(
    40,
    panelWidth - pad * 2 - backSize - profileChipWidth - pad
  );
  const titleSize = clamp(Math.round(20 * scale), 12, 22);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, t("settings.title"), panelX + panelWidth / 2, panelY + pad + headerHeight / 2, {
    size: titleSize,
    minSize: Math.max(10, titleSize - 4),
    maxWidth: titleMaxWidth,
  });
  ctx.restore();
  drawProfileChip(
    ctx,
    panelX + panelWidth - pad - profileChipWidth,
    panelY + pad + (headerHeight - chipHeight) / 2,
    chipHeight,
    user,
    { width: profileChipWidth }
  );

  let y = panelY + pad + headerHeight + clamp(10 * scale, 6, 12);
  const sectionWidth = panelWidth - pad * 2;
  const sectionGap = clamp(12 * scale, 8, 16);
  const rowHeight = clamp(38 * scale, 24, 40);
  const headerSize = clamp(34 * scale, 22, 36);

  const audioSection = drawSettingsSection(
    ctx,
    panelX + pad,
    y,
    sectionWidth,
    t("label.audio"),
    [
      { key: "music", label: t("label.music"), value: audio.music ?? 70, type: "slider" },
      { key: "sfx", label: t("label.sfx"), value: audio.sfx ?? 80, type: "slider" },
      { key: "mute", label: t("label.mute"), value: audio.mute ?? false, type: "toggle" },
    ],
    { capture: true, rowHeight, headerHeight: headerSize, scale, prism: true }
  );
  y = audioSection.endY + sectionGap;
  const showLanguage = state.sdkName !== "yandex";
  const accountRows = [
    { label: t("label.status"), value: resolveUserLabel(state.userName), type: "info" },
    {
      key: "login",
      label: t("label.login"),
      value: t("button.login"),
      type: "action",
    },
  ];
  if (showLanguage) {
    accountRows.push({
      key: "language",
      label: t("label.language"),
      value: getLanguage().toUpperCase(),
      type: "action",
    });
  }
  const accountSection = drawSettingsSection(
    ctx,
    panelX + pad,
    y,
    sectionWidth,
    t("label.account"),
    accountRows,
    { capture: true, rowHeight, headerHeight: headerSize, scale, prism: true }
  );
  const dataSection = drawSettingsSection(
    ctx,
    panelX + pad,
    accountSection.endY + sectionGap,
    sectionWidth,
    t("label.data"),
    [
      {
        key: "resetTutorial",
        label: t("label.reset_tutorial"),
        value: t("button.reset"),
        type: "action",
      },
    ],
    { capture: true, rowHeight, headerHeight: headerSize, scale, prism: true }
  );

  lastLayout.settings = {
    back: backRect,
    audio: audioSection.rects,
    account: accountSection.rects,
    actions: dataSection.rects,
  };
}

function drawLeaderboardsScreen(ctx, render, capsule) {
  if (!capsule) {
    const { width, height } = render.options;
    const pad = 32;
    const headerY = 48;
    const state = getAppState();
    const user = resolveUserLabel(state.userName);
    const rows = state.leaderboards?.allTime || [];

    if (!leaderboardsState.requested) {
      leaderboardsState.requested = true;
      refreshAllTimeLeaderboard();
    }

    const backRect = drawBackButton(ctx, pad, headerY, t("nav.back"));
    drawLeaderboardsHeader(ctx, width, headerY, pad, user);

    const listTop = headerY + 96;
    const leaderTitle = state.leaderboards?.title || t("label.all_time_title");
    drawLeaderboardsList(
      ctx,
      pad,
      listTop,
      width - pad * 2,
      height - listTop - pad,
      leaderTitle,
      rows
    );

    lastLayout.leaderboards = { back: backRect };
    return;
  }

  const { inner } = capsule;
  const scale = getUiScale(inner);
  const state = getAppState();
  const user = resolveUserLabel(state.userName);
  const rows = state.leaderboards?.allTime || [];

  if (!leaderboardsState.requested) {
    leaderboardsState.requested = true;
    refreshAllTimeLeaderboard();
  }

  const basePanelWidth = inner.width * 0.9;
  const basePanelHeight = inner.height * 0.78;
  const panelWidth = Math.min(basePanelWidth * 1.2, inner.width + 80);
  const panelHeight = Math.min(basePanelHeight * 1.3, inner.height + 80);
  const panelX = clamp(
    inner.x + (inner.width - panelWidth) / 2,
    inner.x - 40,
    inner.x + inner.width - panelWidth + 40
  );
  const panelY = clamp(
    inner.y + inner.height * 0.12,
    inner.y - 40,
    inner.y + inner.height - panelHeight + 40
  );
  drawPrismPanel(ctx, panelX, panelY, panelWidth, panelHeight, Math.min(24, panelHeight * 0.08));

  const pad = clamp(panelWidth * 0.04, 8, 20);
  const headerHeight = clamp(48 * scale, 28, 56);
  const backSize = clamp(32 * scale, 20, 36);
  const backRect = drawBackIconButton(
    ctx,
    panelX + pad,
    panelY + pad + (headerHeight - backSize) / 2,
    backSize
  );

  const chipHeight = backSize;
  const profileChipWidth = clamp(chipHeight * 3.6, 96, 180);
  const titleMaxWidth = Math.max(
    40,
    panelWidth - pad * 2 - backSize - profileChipWidth - pad
  );
  const titleSize = clamp(Math.round(20 * scale), 12, 22);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, t("leaderboards.title"), panelX + panelWidth / 2, panelY + pad + headerHeight / 2, {
    size: titleSize,
    minSize: Math.max(10, titleSize - 4),
    maxWidth: titleMaxWidth,
  });
  ctx.restore();
  drawProfileChip(
    ctx,
    panelX + panelWidth - pad - profileChipWidth,
    panelY + pad + (headerHeight - chipHeight) / 2,
    chipHeight,
    user,
    { width: profileChipWidth }
  );

  const listTop = panelY + pad + headerHeight + clamp(14 * scale, 8, 16);
  const leaderTitle = state.leaderboards?.title || t("label.all_time_title");
  drawLeaderboardsList(
    ctx,
    panelX + pad,
    listTop,
    panelWidth - pad * 2,
    panelY + panelHeight - pad - listTop,
    leaderTitle,
    rows,
    { scale, prism: true }
  );

  lastLayout.leaderboards = { back: backRect };
}

function drawLeaderboardsHeader(ctx, width, y, pad, user) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleSize = 24;
  const userSize = 12;
  const userMaxWidth = Math.max(40, width * 0.25);
  const titleMaxWidth = Math.max(
    40,
    width - pad - 48 - userMaxWidth - 8 - (pad + 20)
  );
  drawFittedText(ctx, t("leaderboards.title"), width / 2, y + 16, {
    size: titleSize,
    minSize: 12,
    maxWidth: titleMaxWidth,
  });

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(width - pad - 20, y + 16, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  drawFittedText(ctx, user, width - pad - 48, y + 16, {
    size: userSize,
    minSize: 9,
    maxWidth: userMaxWidth,
  });
  ctx.restore();
}

function drawLeaderboardsList(ctx, x, y, width, height, label, rows, options = {}) {
  const scale = options.scale ?? 1;
  const labelSize = Math.max(9, Math.round(12 * scale));
  const rowHeight = Math.max(24, Math.round(34 * scale));
  const rowGap = Math.max(3, Math.round(6 * scale));
  ctx.save();
  if (options.prism) {
    drawPrismPanel(ctx, x, y, width, height, 16, {
      fill: "rgba(12, 18, 26, 0.55)",
      stroke: "rgba(95, 227, 255, 0.25)",
    });
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, x, y, width, height, 16);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  drawFittedText(ctx, label, x + 16, y + 12, {
    size: labelSize,
    minSize: 8,
    maxWidth: width - 32,
  });

  let rowY = y + 40;
  for (const row of rows) {
    if (rowY + rowHeight > y + height - 8) {
      break;
    }
    drawLeaderboardRow(ctx, x + 12, rowY, width - 24, rowHeight, row);
    rowY += rowHeight + rowGap;
  }
  ctx.restore();
}

function drawLeaderboardRow(ctx, x, y, width, height, row) {
  drawPrismPanel(ctx, x, y, width, height, 12, {
    fill: row.highlight ? "rgba(95, 227, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
    stroke: row.highlight ? "rgba(95, 227, 255, 0.55)" : "rgba(255, 255, 255, 0.18)",
  });
  ctx.save();
  ctx.fillStyle = "#ffffff";
  const fontSize = Math.max(9, Math.round(height * 0.35));
  const scoreMaxWidth = Math.max(40, Math.round(width * 0.3));
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `${fontSize}px "RussoOne", sans-serif`;
  ctx.fillText(String(row.rank), x + 12, y + height / 2);
  drawFittedText(ctx, row.name, x + 48, y + height / 2, {
    size: fontSize,
    minSize: Math.max(8, fontSize - 2),
    maxWidth: Math.max(40, width - 72 - scoreMaxWidth),
  });
  ctx.textAlign = "right";
  drawFittedText(ctx, formatValue(row.score), x + width - 12, y + height / 2, {
    size: fontSize,
    minSize: Math.max(8, fontSize - 2),
    maxWidth: scoreMaxWidth,
  });
  ctx.restore();
}

function drawSettingsHeader(ctx, width, y, pad, user) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleSize = 24;
  const userSize = 12;
  const userMaxWidth = Math.max(40, width * 0.25);
  const titleMaxWidth = Math.max(
    40,
    width - pad - 48 - userMaxWidth - 8 - (pad + 20)
  );
  drawFittedText(ctx, t("settings.title"), width / 2, y + 16, {
    size: titleSize,
    minSize: 12,
    maxWidth: titleMaxWidth,
  });

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(width - pad - 20, y + 16, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  drawFittedText(ctx, user, width - pad - 48, y + 16, {
    size: userSize,
    minSize: 9,
    maxWidth: userMaxWidth,
  });
  ctx.restore();
}

function drawSettingsSection(ctx, x, y, width, title, rows, options = {}) {
  const scale = options.scale ?? 1;
  const headerHeight = options.headerHeight ?? 40;
  const rowHeight = options.rowHeight ?? 40;
  const pad = options.pad ?? Math.max(8, Math.round(14 * scale));
  const radius = options.radius ?? 18;
  const totalHeight = headerHeight + rows.length * rowHeight;
  ctx.save();
  if (options.prism) {
    drawPrismPanel(ctx, x, y, width, totalHeight, radius, {
      fill: "rgba(12, 18, 26, 0.6)",
      stroke: "rgba(95, 227, 255, 0.3)",
    });
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    roundRect(ctx, x, y, width, totalHeight, radius);
    ctx.fill();
  }

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const titleSize = Math.max(10, Math.round(16 * scale));
  drawFittedText(ctx, title, x + pad, y + headerHeight / 2, {
    size: titleSize,
    minSize: Math.max(9, titleSize - 3),
    maxWidth: width - pad * 2,
  });

  const rects = {};
  let rowY = y + headerHeight;
  for (const row of rows) {
    const controlRect = drawSettingsRow(ctx, x + pad, rowY, width - pad * 2, row, {
      rowHeight,
      scale,
      prism: options.prism,
    });
    if (options.capture && row.key && controlRect) {
      rects[row.key] = controlRect;
    }
    rowY += rowHeight;
  }
  ctx.restore();
  return { endY: rowY, rects };
}

function drawSettingsRow(ctx, x, y, width, row, options = {}) {
  const scale = options.scale ?? 1;
  const rowHeight = options.rowHeight ?? 34;
  const radius = Math.min(12, rowHeight / 2);
  const labelSize = Math.max(9, Math.round(12 * scale));
  const labelX = x + 12;
  const labelY = y + rowHeight / 2;
  ctx.save();
  if (options.prism) {
    drawPrismPanel(ctx, x, y, width, rowHeight, radius, {
      fill: "rgba(10, 16, 24, 0.5)",
      stroke: "rgba(255, 255, 255, 0.12)",
    });
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(ctx, x, y, width, rowHeight, radius);
    ctx.fill();
  }

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let controlRect = null;
  if (row.type === "slider") {
    const sliderWidth = Math.max(70, Math.min(140 * scale, width * 0.4));
    const sliderHeight = Math.max(4, Math.round(rowHeight * 0.22));
    drawFittedText(ctx, row.label, labelX, labelY, {
      size: labelSize,
      minSize: 8,
      maxWidth: Math.max(40, width - sliderWidth - 24),
    });
    const sliderRect = {
      x: x + width - sliderWidth - 12,
      y: y + (rowHeight - sliderHeight) / 2,
      width: sliderWidth,
      height: sliderHeight,
      type: "slider",
    };
    drawSlider(ctx, sliderRect.x, sliderRect.y, sliderRect.width, sliderRect.height, row.value || 0);
    controlRect = sliderRect;
  } else if (row.type === "toggle") {
    const toggleWidth = Math.max(30, Math.round(42 * scale));
    const toggleHeight = Math.max(14, Math.round(rowHeight * 0.5));
    drawFittedText(ctx, row.label, labelX, labelY, {
      size: labelSize,
      minSize: 8,
      maxWidth: Math.max(40, width - toggleWidth - 24),
    });
    const toggleRect = {
      x: x + width - toggleWidth - 12,
      y: y + (rowHeight - toggleHeight) / 2,
      width: toggleWidth,
      height: toggleHeight,
      type: "toggle",
    };
    drawToggle(ctx, toggleRect.x, toggleRect.y, toggleRect.width, toggleRect.height, row.value);
    controlRect = toggleRect;
  } else if (row.type === "action") {
    const actionWidth = Math.max(74, Math.round(100 * scale));
    const actionHeight = Math.max(20, Math.round(rowHeight * 0.65));
    drawFittedText(ctx, row.label, labelX, labelY, {
      size: labelSize,
      minSize: 8,
      maxWidth: Math.max(40, width - actionWidth - 24),
    });
    controlRect = drawActionButton(
      ctx,
      x + width - actionWidth - 12,
      y + (rowHeight - actionHeight) / 2,
      actionWidth,
      actionHeight,
      row.value,
      row.danger
    );
  } else {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const valueText = formatValue(row.value);
    const valueMaxWidth = Math.max(60, width * 0.38);
    drawFittedText(ctx, valueText, x + width - 12, labelY, {
      size: labelSize,
      minSize: 8,
      maxWidth: valueMaxWidth,
    });
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    drawFittedText(ctx, row.label, labelX, labelY, {
      size: labelSize,
      minSize: 8,
      maxWidth: Math.max(40, width - valueMaxWidth - 24),
    });
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

function drawActionButton(ctx, x, y, w, h, label, danger = false, disabled = false) {
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, label, x + w / 2, y + h / 2, {
    size: 11,
    minSize: 9,
    maxWidth: w - 12,
  });
  ctx.restore();
  return { x, y, width: w, height: h };
}

function drawShopHeader(ctx, width, y, pad, coins) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleMaxWidth = Math.max(40, width - pad * 2 - 120 - 12);
  drawFittedText(ctx, t("shop.title"), width / 2, y + 16, {
    size: 24,
    minSize: 12,
    maxWidth: titleMaxWidth,
  });
  drawPill(ctx, width - pad - 120, y, 120, 36, t("label.coins"), coins);
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, label, x + w / 2, y + h / 2, {
    size: 12,
    minSize: 9,
    maxWidth: w - 12,
  });
  ctx.restore();
  return { x, y, width: w, height: h };
}

function drawBackIconButton(ctx, x, y, size) {
  drawPrismPanel(ctx, x, y, size, size, Math.min(12, size / 2), {
    fill: "rgba(10, 18, 28, 0.6)",
    stroke: "rgba(255, 255, 255, 0.35)",
  });
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1.5, size * 0.08);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.62, y + size * 0.3);
  ctx.lineTo(x + size * 0.4, y + size * 0.5);
  ctx.lineTo(x + size * 0.62, y + size * 0.7);
  ctx.stroke();
  ctx.restore();
  return { x, y, width: size, height: size };
}

function drawShopTabs(ctx, cx, y, activeTab, options = {}) {
  const w = options.width ?? 240;
  const h = options.height ?? 34;
  const gap = options.gap ?? 12;
  const leftX = cx - w - gap / 2;
  const rightX = cx + gap / 2;
  const upgrades = drawTabButton(
    ctx,
    leftX,
    y,
    w,
    h,
    t("shop.tab.upgrades"),
    activeTab === "upgrades"
  );
  const items = drawTabButton(
    ctx,
    rightX,
    y,
    w,
    h,
    t("shop.tab.items"),
    activeTab === "items"
  );
  return { upgrades, items };
}

function drawTabButton(ctx, x, y, w, h, label, active) {
  drawPrismPanel(ctx, x, y, w, h, Math.min(12, h / 2), {
    fill: active ? "rgba(95, 227, 255, 0.18)" : "rgba(255, 255, 255, 0.08)",
    stroke: active ? "rgba(95, 227, 255, 0.8)" : "rgba(255, 255, 255, 0.35)",
  });
  ctx.save();
  ctx.fillStyle = active ? "#ffffff" : "rgba(255, 255, 255, 0.75)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, label, x + w / 2, y + h / 2, {
    size: Math.max(10, Math.round(h * 0.36)),
    minSize: 9,
    maxWidth: w - 12,
  });
  ctx.restore();
  return { x, y, width: w, height: h };
}

function drawShopSectionHeader(ctx, x, y, width, title, options = {}) {
  const height = options.height ?? 24;
  const size = options.size ?? Math.max(10, Math.round(height * 0.65));
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, title, x, y + height / 2, {
    size,
    minSize: Math.max(9, size - 3),
    maxWidth: width,
  });
  ctx.restore();
  return height;
}

function drawShopSections(ctx, x, y, width, sections, options = {}) {
  const sectionGap = options.sectionGap ?? 18;
  const headerHeight = options.sectionHeaderHeight ?? 24;
  const headerSize = options.sectionHeaderSize ?? Math.max(10, Math.round(headerHeight * 0.65));
  const scrollOffset = options.scrollOffset ?? 0;
  const clipRect = options.clipRect ?? null;
  if (clipRect) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(clipRect.x, clipRect.y, clipRect.width, clipRect.height);
    ctx.clip();
  }
  let cursor = y - scrollOffset;
  let first = true;
  for (const section of sections) {
    if (!section.cards || section.cards.length === 0) {
      continue;
    }
    if (!first) {
      cursor += sectionGap;
    }
    if (section.title) {
      const drawn = drawShopSectionHeader(ctx, x, cursor, width, section.title, {
        height: headerHeight,
        size: headerSize,
      });
      cursor += drawn;
    }
    const cardsHeight = getShopCardsHeight(
      section.cards,
      options.cardHeight ?? 86,
      options.gap ?? 16
    );
    drawShopCards(ctx, x, cursor, width, cardsHeight, section.cards, section.showNext, {
      ...options,
      scrollOffset: 0,
      clipRect: null,
    });
    cursor += cardsHeight;
    first = false;
  }
  if (clipRect) {
    ctx.restore();
  }
  return Math.max(0, cursor - (y - scrollOffset));
}

function drawShopCards(ctx, x, y, width, height, cards, showNext, options = {}) {
  const cols = 1;
  const gap = options.gap ?? 16;
  const cardHeight = options.cardHeight ?? 86;
  const fontSize = options.fontSize ?? 14;
  const actionWidth = options.actionWidth ?? 120;
  const actionHeight = options.actionHeight ?? 38;
  const scrollOffset = options.scrollOffset ?? 0;
  const clipRect = options.clipRect ?? null;
  const textPad = Math.max(8, Math.round(cardHeight * 0.18));
  const textWidth = Math.max(40, width - actionWidth - textPad * 2 - 8);
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  if (clipRect) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(clipRect.x, clipRect.y, clipRect.width, clipRect.height);
    ctx.clip();
  }
  const listTop = y;
  const listBottom = y + height;
  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    const cardY = y + i * (cardHeight + gap) - scrollOffset;
    if (cardY + cardHeight < listTop || cardY > listBottom) {
      continue;
    }
    drawPrismPanel(ctx, x, cardY, width, cardHeight, Math.min(16, cardHeight * 0.22), {
      fill: "rgba(12, 18, 26, 0.55)",
      stroke: "rgba(95, 227, 255, 0.3)",
    });

    ctx.fillStyle = "#ffffff";
    drawFittedText(ctx, card.title, x + textPad, cardY + cardHeight * 0.18, {
      size: fontSize,
      minSize: 10,
      maxWidth: textWidth,
    });
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const meta = showNext
      ? `${card.current} -> ${card.next}`
      : card.meta || card.owned || "";
    drawFittedText(ctx, meta, x + textPad, cardY + cardHeight * 0.46, {
      size: fontSize,
      minSize: 9,
      maxWidth: textWidth,
    });
    if (!showNext && card.owned) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      drawFittedText(ctx, card.owned, x + textPad, cardY + cardHeight * 0.68, {
        size: fontSize,
        minSize: 9,
        maxWidth: textWidth,
      });
    }
    if (showNext && card.progress !== undefined && card.progress !== null) {
      const barWidth = textWidth;
      const barHeight = Math.max(4, Math.round(cardHeight * 0.08));
      const barX = x + textPad;
      const barY = cardY + cardHeight * 0.72;
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      roundRect(ctx, barX, barY, barWidth, barHeight, barHeight / 2);
      ctx.fill();
      const fillWidth = Math.max(0, Math.min(1, card.progress)) * barWidth;
      ctx.fillStyle = "rgba(95, 227, 255, 0.85)";
      roundRect(ctx, barX, barY, fillWidth, barHeight, barHeight / 2);
      ctx.fill();
      ctx.restore();
      if (card.progressLabel) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        drawFittedText(
          ctx,
          card.progressLabel,
          barX + barWidth,
          barY + barHeight * 0.5,
          { size: Math.max(9, Math.round(fontSize * 0.9)), minSize: 8, maxWidth: barWidth }
        );
        ctx.restore();
      }
    }

    const actionRect = drawActionButton(
      ctx,
      x + width - actionWidth - textPad,
      cardY + (cardHeight - actionHeight) / 2,
      actionWidth,
      actionHeight,
      card.actionLabel || card.price,
      false,
      card.actionDisabled
    );
    addShopAction(card, actionRect);
  }
  if (clipRect) {
    ctx.restore();
  }
  ctx.restore();
}

function getShopCardsMaxScroll(cards, cardHeight, gap, height) {
  if (!cards || cards.length === 0) {
    return 0;
  }
  const totalHeight = cardHeight * cards.length + gap * (cards.length - 1);
  return Math.max(0, totalHeight - height);
}

function getShopCardsHeight(cards, cardHeight, gap) {
  if (!cards || cards.length === 0) {
    return 0;
  }
  return cardHeight * cards.length + gap * (cards.length - 1);
}

function getShopSectionsHeight(sections, options = {}) {
  if (!sections || sections.length === 0) {
    return 0;
  }
  const gap = options.gap ?? 16;
  const cardHeight = options.cardHeight ?? 86;
  const headerHeight = options.sectionHeaderHeight ?? 24;
  const sectionGap = options.sectionGap ?? 18;
  let total = 0;
  let first = true;
  for (const section of sections) {
    if (!section.cards || section.cards.length === 0) {
      continue;
    }
    if (!first) {
      total += sectionGap;
    }
    if (section.title) {
      total += headerHeight;
    }
    total += getShopCardsHeight(section.cards, cardHeight, gap);
    first = false;
  }
  return total;
}

function drawHeader(ctx, width, y, pad, { user, coins, best }) {
  const buttonSize = 40;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(pad + buttonSize / 2, y + buttonSize / 2, buttonSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const pillWidth = 120;
  const gap = 10;
  const userMaxWidth = Math.max(
    40,
    width - (pad + buttonSize + 8) - (pillWidth * 2 + gap + pad)
  );
  drawFittedText(ctx, user, pad + buttonSize + 8, y + buttonSize / 2, {
    size: 14,
    minSize: 10,
    maxWidth: userMaxWidth,
  });

  const pillHeight = 36;
  const bestX = width - pad - pillWidth;
  const coinsX = bestX - gap - pillWidth;
  drawPill(ctx, coinsX, y + 2, pillWidth, pillHeight, t("label.coins"), coins);
  drawPill(ctx, bestX, y + 2, pillWidth, pillHeight, t("label.best"), best);
  ctx.restore();
}

function drawPill(ctx, x, y, w, h, label, value) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, label, x + 12, y + h / 2, {
    size: 12,
    minSize: 9,
    maxWidth: w * 0.5,
  });
  ctx.textAlign = "right";
  drawFittedText(ctx, formatValue(value), x + w - 12, y + h / 2, {
    size: 12,
    minSize: 9,
    maxWidth: w * 0.42,
  });
  ctx.restore();
}

function drawFooter(ctx, width, y, totalWidth) {
  const buttonWidth = totalWidth / 3;
  const buttonHeight = 38;
  const startX = width / 2 - totalWidth / 2;
  const items = [
    { key: "shop", label: t("nav.shop") },
    { key: "leaders", label: t("nav.leaders") },
    { key: "settings", label: t("nav.settings") },
  ];
  const rects = {};
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < items.length; i += 1) {
    const x = startX + i * buttonWidth;
    const rect = { x, y, width: buttonWidth, height: buttonHeight };
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    drawFittedText(ctx, items[i].label, rect.x + rect.width / 2, rect.y + rect.height / 2, {
      size: 14,
      minSize: 9,
      maxWidth: rect.width - 10,
    });
    rects[items[i].key] = rect;
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
    return t("shop.title");
  }
  if (screenId === ScreenId.SETTINGS) {
    return t("settings.title");
  }
  if (screenId === ScreenId.LEADERBOARDS) {
    return t("leaderboards.title");
  }
  return t("nav.home");
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, label, cx, cy, {
    size: 24,
    minSize: 14,
    maxWidth: width - 16,
  });
  ctx.restore();
  return { x, y, width, height };
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const size = Math.max(20, Math.round(inner.height * 0.06));
  drawFittedText(ctx, title, inner.x + inner.width / 2, inner.y + inner.height * 0.09, {
    size,
    minSize: Math.max(12, size - 6),
    maxWidth: inner.width - 16,
  });
  ctx.restore();
}

function drawSubtext(ctx, x, y, size = 14, text = "", maxWidth = Infinity) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  drawFittedText(ctx, text, x, y, {
    size,
    minSize: 9,
    maxWidth,
  });
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

function drawProfileChip(ctx, x, y, size, label, options = {}) {
  const chipWidth = options.width ?? clamp(size * 3.6, 96, 180);
  const chipHeight = size;
  drawPrismPanel(ctx, x, y, chipWidth, chipHeight, chipHeight / 2);
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(x + chipHeight / 2, y + chipHeight / 2, chipHeight * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawFittedText(ctx, label, x + chipHeight, y + chipHeight / 2, {
    size: Math.max(10, Math.round(chipHeight * 0.38)),
    minSize: 9,
    maxWidth: chipWidth - chipHeight - 8,
  });
  ctx.restore();
}

function drawHudChip(ctx, x, y, width, height, label, value) {
  drawPrismPanel(ctx, x, y, width, height, height / 2, {
    fill: "rgba(12, 18, 26, 0.55)",
    stroke: "rgba(95, 227, 255, 0.45)",
  });
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const valueMaxWidth = Math.max(40, width * 0.45);
  drawFittedText(ctx, label, x + height * 0.4, y + height / 2, {
    size: Math.max(10, Math.round(height * 0.32)),
    minSize: 9,
    maxWidth: Math.max(40, width - valueMaxWidth - height * 0.5),
  });
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  drawFittedText(ctx, formatValue(value), x + width - height * 0.35, y + height / 2, {
    size: Math.max(10, Math.round(height * 0.32)),
    minSize: 9,
    maxWidth: valueMaxWidth,
  });
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
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const rightPadding = height * 0.35;
  const leftPadding = iconX - x + iconSize + 8;
  const valueMaxWidth = Math.max(40, width - leftPadding - rightPadding);
  drawFittedText(ctx, formatValue(value), x + width - height * 0.35, y + height / 2, {
    size: Math.max(10, Math.round(height * 0.43)),
    minSize: 9,
    maxWidth: valueMaxWidth,
  });
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
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawFittedText(ctx, label, cx, cy, {
      size: Math.max(16, Math.round(height * 0.45)),
      minSize: 12,
      maxWidth: width - 16,
    });
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
  const items = [
    { key: "shop", label: t("nav.shop"), icon: "shop" },
    { key: "leaders", label: t("nav.leaders"), icon: "leaders" },
    { key: "settings", label: t("nav.settings"), icon: "settings" },
  ];
  const rects = {};
  for (let i = 0; i < items.length; i += 1) {
    const bx = x + gap + i * (buttonSize + gap);
    const by = y + (height - buttonSize) / 2;
    const rect = drawIconButton(
      ctx,
      bx,
      by,
      buttonSize,
      items[i].label,
      getUiButtonImage(items[i].icon)
    );
    rects[items[i].key] = rect;
  }
  return rects;
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
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawFittedText(ctx, label, x + size / 2, y + size / 2, {
      size: Math.max(10, Math.round(size * 0.22)),
      minSize: 8,
      maxWidth: size - 8,
    });
  }
  ctx.restore();
  return { x, y, width: size, height: size };
}

function resolveUserLabel(value) {
  if (!value || value === "Guest") {
    return t("user.guest");
  }
  return value;
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

function getUiScale(inner) {
  const scale = Math.min(inner.width / 360, inner.height / 640);
  return clamp(scale, 0.6, 1.1);
}

function drawFittedText(ctx, text, x, y, options = {}) {
  const fontFamily = options.fontFamily ?? "\"RussoOne\", sans-serif";
  const maxWidth = options.maxWidth ?? Infinity;
  let size = Math.round(options.size ?? 12);
  const minSize = Math.round(options.minSize ?? Math.max(8, size - 3));

  if (Number.isFinite(maxWidth) && maxWidth > 0) {
    ctx.font = `${size}px ${fontFamily}`;
    while (size > minSize && ctx.measureText(text).width > maxWidth) {
      size -= 1;
      ctx.font = `${size}px ${fontFamily}`;
    }
  }

  let drawText = text;
  if (Number.isFinite(maxWidth) && maxWidth > 0) {
    ctx.font = `${size}px ${fontFamily}`;
    if (ctx.measureText(drawText).width > maxWidth) {
      drawText = ellipsizeText(ctx, drawText, maxWidth);
    }
  }

  ctx.font = `${size}px ${fontFamily}`;
  ctx.fillText(drawText, x, y);
  return { size, text: drawText };
}

function ellipsizeText(ctx, text, maxWidth) {
  if (!text) {
    return "";
  }
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
    return text;
  }
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  const ellipsis = "...";
  let end = text.length;
  while (end > 0) {
    const candidate = `${text.slice(0, end)}${ellipsis}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      return candidate;
    }
    end -= 1;
  }
  return ellipsis;
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
