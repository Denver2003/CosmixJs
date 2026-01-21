import {
  loadAudioSettings,
  loadBestScore,
  loadBonusInventory,
  loadCoins,
  loadTutorialProgress,
  saveBestScore,
  saveBonusInventory,
  saveCoins,
  saveTutorialProgress,
} from "../game/storage.js";
import { setAudioSettings } from "../audio/index.js";
import { setAppState } from "../shell/app_state.js";
import { setShopProgress } from "../shop/progression.js";
import { loadShopProgress, saveShopProgress } from "../shop/storage.js";

const CLOUD_VERSION = 1;

export function buildCloudPayload() {
  return {
    version: CLOUD_VERSION,
    updatedAt: Date.now(),
    coins: loadCoins(),
    bestScore: loadBestScore(),
    bonusInventory: loadBonusInventory(),
    shopProgress: loadShopProgress(),
    audio: loadAudioSettings(),
    tutorial: loadTutorialProgress(),
  };
}

export function applyCloudPayload(payload) {
  if (!hasCloudData(payload)) {
    return { applied: false };
  }
  const local = buildLocalSnapshot();
  const resolved = {
    coins: resolveInt(payload?.coins, local.coins),
    bestScore: resolveInt(payload?.bestScore, local.bestScore),
    bonusInventory: mergeInventory(payload?.bonusInventory, local.bonusInventory),
    shopProgress: mergeShopProgress(payload?.shopProgress, local.shopProgress),
    audio: mergeAudioSettings(payload?.audio, local.audio),
    tutorial: mergeTutorial(payload?.tutorial, local.tutorial),
  };
  saveCoins(resolved.coins);
  saveBestScore(resolved.bestScore);
  saveBonusInventory(resolved.bonusInventory);
  saveShopProgress(resolved.shopProgress);
  saveTutorialProgress(resolved.tutorial.completed);
  setShopProgress(resolved.shopProgress);
  setAudioSettings(resolved.audio);
  setAppState({ coins: resolved.coins, bestScore: resolved.bestScore });
  return { applied: true, payload: resolved };
}

function hasCloudData(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  return (
    payload.coins !== undefined ||
    payload.bestScore !== undefined ||
    payload.bonusInventory !== undefined ||
    payload.shopProgress !== undefined ||
    payload.audio !== undefined ||
    payload.tutorial !== undefined
  );
}

function buildLocalSnapshot() {
  return {
    coins: loadCoins(),
    bestScore: loadBestScore(),
    bonusInventory: loadBonusInventory(),
    shopProgress: loadShopProgress(),
    audio: loadAudioSettings(),
    tutorial: loadTutorialProgress(),
  };
}

function resolveInt(value, fallback) {
  if (value === undefined || value === null) {
    return Math.max(0, Math.floor(fallback || 0));
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

function mergeInventory(value, fallback) {
  const base = fallback || { touch: 0, gun: 0 };
  if (!value || typeof value !== "object") {
    return { ...base };
  }
  return {
    touch: resolveInt(value.touch, base.touch),
    gun: resolveInt(value.gun, base.gun),
  };
}

function mergeShopProgress(value, fallback) {
  const base = fallback || {
    upgrades: {
      coin_multiplier: 0,
      score_multiplier: 0,
      bonus_drop: 0,
      bonus_upgrade: 0,
    },
    removeAds: false,
  };
  if (!value || typeof value !== "object") {
    return { ...base, upgrades: { ...base.upgrades } };
  }
  const upgrades = value.upgrades && typeof value.upgrades === "object" ? value.upgrades : {};
  return {
    upgrades: {
      ...base.upgrades,
      ...upgrades,
    },
    removeAds:
      value.removeAds === undefined || value.removeAds === null
        ? base.removeAds
        : Boolean(value.removeAds),
  };
}

function mergeAudioSettings(value, fallback) {
  const base = fallback || { music: 70, sfx: 80, mute: false };
  if (!value || typeof value !== "object") {
    return { ...base };
  }
  return {
    music: resolvePercent(value.music, base.music),
    sfx: resolvePercent(value.sfx, base.sfx),
    mute:
      value.mute === undefined || value.mute === null ? base.mute : Boolean(value.mute),
  };
}

function resolvePercent(value, fallback) {
  if (value === undefined || value === null) {
    return clampPercent(fallback);
  }
  return clampPercent(value);
}

function clampPercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function mergeTutorial(value, fallback) {
  const base = fallback || { completed: false };
  if (!value || typeof value !== "object") {
    return { ...base };
  }
  return {
    completed:
      value.completed === undefined || value.completed === null
        ? base.completed
        : Boolean(value.completed),
  };
}
