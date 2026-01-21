import { addShopRewardWatch, cleanupRewardedShopTimes, getAdsState } from "./runtime.js";

const SHOP_COOLDOWN_MS = 2 * 60 * 1000;

export function getShopRewardStatus(now, moneyCoef = 1) {
  const state = getAdsState();
  const times = cleanupRewardedShopTimes(now);
  const count = times.length;
  const lastWatch = count > 0 ? Math.max(...times) : 0;
  const cooldownRemaining = Math.max(0, SHOP_COOLDOWN_MS - (now - lastWatch));
  const available = count < 5 && cooldownRemaining === 0;
  const reward = calcShopRewardCoins(state.totalSpentCoins || 0, moneyCoef);
  return {
    available,
    count,
    limit: 5,
    reward,
    cooldownRemaining,
  };
}

export function applyShopReward(now) {
  addShopRewardWatch(now);
}

export function calcShopRewardCoins(totalSpentCoins, moneyCoef = 1) {
  const base = 100 + Math.sqrt(Math.max(0, totalSpentCoins)) * 1.2;
  const multiplier = 0.75 + 0.25 * Math.max(0, moneyCoef || 1);
  const value = Math.round(base * multiplier);
  return Math.round(value / 50) * 50;
}
