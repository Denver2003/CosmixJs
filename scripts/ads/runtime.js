import { loadAdsState, saveAdsState } from "./storage.js";

const HOUR_MS = 60 * 60 * 1000;

let state = loadAdsState();
let continueCount = 0;

export function getAdsState() {
  return { ...state, rewardedShopWatchTimes: [...state.rewardedShopWatchTimes] };
}

export function setAdsState(next) {
  state = { ...next };
  saveAdsState(state);
}

export function resetContinueCount() {
  continueCount = 0;
}

export function incrementContinueCount() {
  continueCount += 1;
  return continueCount;
}

export function getContinueCount() {
  return continueCount;
}

export function incrementSessionCount() {
  state.sessionCount = Math.max(0, (state.sessionCount || 0) + 1);
  saveAdsState(state);
  return state.sessionCount;
}

export function markInterstitialShown(now) {
  state.lastInterstitialAt = now;
  saveAdsState(state);
}

export function addShopRewardWatch(now) {
  cleanupRewardedShopTimes(now);
  state.rewardedShopWatchTimes.push(now);
  saveAdsState(state);
}

export function cleanupRewardedShopTimes(now) {
  const cutoff = now - HOUR_MS;
  state.rewardedShopWatchTimes = (state.rewardedShopWatchTimes || []).filter(
    (ts) => ts >= cutoff
  );
  saveAdsState(state);
  return state.rewardedShopWatchTimes;
}

export function addTotalSpentCoins(amount) {
  const value = Math.max(0, Math.floor(amount || 0));
  state.totalSpentCoins = Math.max(0, (state.totalSpentCoins || 0) + value);
  saveAdsState(state);
  return state.totalSpentCoins;
}
