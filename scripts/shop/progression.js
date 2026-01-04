import { BONUS_COOLDOWN_MS } from "../config.js";
import {
  BONUS_DROP_LEVELS,
  COIN_MULTIPLIER_LEVELS,
  REAL_MONEY_ITEMS,
  SCORE_MULTIPLIER_LEVELS,
  SHOP_ITEMS,
  UPGRADE_TYPES,
  getUpgradePrice,
} from "./model.js";
import { loadShopProgress, saveShopProgress } from "./storage.js";

function createDefaultProgress() {
  return {
    upgrades: {
      [UPGRADE_TYPES.COIN_MULTIPLIER]: 0,
      [UPGRADE_TYPES.SCORE_MULTIPLIER]: 0,
      [UPGRADE_TYPES.BONUS_DROP]: 0,
      [UPGRADE_TYPES.BONUS_UPGRADE]: 0,
    },
    removeAds: false,
  };
}

let shopProgress = loadShopProgress();

export function getShopProgress() {
  return shopProgress;
}

export function setShopProgress(next) {
  shopProgress = next || createDefaultProgress();
  saveShopProgress(shopProgress);
  return shopProgress;
}

export function updateShopProgress(partial) {
  const base = shopProgress || createDefaultProgress();
  shopProgress = {
    ...base,
    ...partial,
    upgrades: {
      ...base.upgrades,
      ...(partial?.upgrades || {}),
    },
  };
  saveShopProgress(shopProgress);
  return shopProgress;
}

export function getUpgradeLevel(progress, type) {
  const level = progress?.upgrades?.[type] ?? 0;
  return Math.max(0, Math.floor(level));
}

export function getMaxUpgradeLevel(type) {
  if (type === UPGRADE_TYPES.COIN_MULTIPLIER) {
    return COIN_MULTIPLIER_LEVELS.length - 1;
  }
  if (type === UPGRADE_TYPES.SCORE_MULTIPLIER) {
    return SCORE_MULTIPLIER_LEVELS.length - 1;
  }
  if (type === UPGRADE_TYPES.BONUS_DROP) {
    return BONUS_DROP_LEVELS.length - 1;
  }
  return 7;
}

export function applyShopToGameState(state, progress = shopProgress) {
  const coinLevel = getUpgradeLevel(progress, UPGRADE_TYPES.COIN_MULTIPLIER);
  const scoreLevel = getUpgradeLevel(progress, UPGRADE_TYPES.SCORE_MULTIPLIER);
  const bonusDropLevel = getUpgradeLevel(progress, UPGRADE_TYPES.BONUS_DROP);
  const bonusUpgradeLevel = getUpgradeLevel(progress, UPGRADE_TYPES.BONUS_UPGRADE);

  state.moneyCoef = COIN_MULTIPLIER_LEVELS[coinLevel] ?? 1;
  state.scoreCoef = SCORE_MULTIPLIER_LEVELS[scoreLevel] ?? 1;
  state.bonusDropChance = BONUS_DROP_LEVELS[bonusDropLevel] ?? 0;
  state.bonusUpgradeLevel = bonusUpgradeLevel;
  state.bonusCooldownMs = bonusUpgradeLevel >= 5 ? 120000 : BONUS_COOLDOWN_MS;
  state.removeAds = Boolean(progress?.removeAds);
  return state;
}

export function tryBuyUpgrade(progress, type, coins) {
  const currentLevel = getUpgradeLevel(progress, type);
  const maxLevel = getMaxUpgradeLevel(type);
  if (currentLevel >= maxLevel) {
    return { ok: false, reason: "maxed", coins };
  }
  const price = getUpgradePrice(currentLevel);
  if (price == null) {
    return { ok: false, reason: "invalid", coins };
  }
  if (coins < price) {
    return { ok: false, reason: "coins", coins };
  }
  const nextLevel = currentLevel + 1;
  progress.upgrades[type] = nextLevel;
  return { ok: true, coins: coins - price, level: nextLevel, price };
}

export function tryBuyItem(progress, itemId, coins, inventory) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item) {
    return { ok: false, reason: "invalid", coins };
  }
  if (coins < item.cost) {
    return { ok: false, reason: "coins", coins };
  }
  const nextInventory = { ...inventory };
  const key = item.grant?.key;
  const amount = item.grant?.amount ?? 0;
  if (key) {
    nextInventory[key] = Math.max(0, Math.floor(nextInventory[key] || 0)) + amount;
  }
  return {
    ok: true,
    coins: coins - item.cost,
    inventory: nextInventory,
    item,
  };
}

export function tryBuyRealMoneyItem(progress, itemId) {
  const item = REAL_MONEY_ITEMS.find((entry) => entry.id === itemId);
  if (!item) {
    return { ok: false, reason: "invalid" };
  }
  if (itemId === "remove_ads") {
    if (progress.removeAds) {
      return { ok: false, reason: "owned" };
    }
    progress.removeAds = true;
    return { ok: true, item };
  }
  if (item.grant?.key === "coins") {
    return { ok: true, item, grant: item.grant };
  }
  return { ok: false, reason: "invalid" };
}
