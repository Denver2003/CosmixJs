import { ROTATE_RANGE } from "../config.js";
import { createRandomSpec } from "../shapes.js";
import { applyShopToGameState, getShopProgress } from "../shop/progression.js";
import { loadBonusInventory, loadCoins } from "./storage.js";
import { createTutorialState } from "./tutorial.js";

export function getColorsCount(level) {
  return Math.min(4 + Math.floor((level - 1) / 5), 7);
}

export function getRotationRange(level) {
  if (level <= 5) {
    return 0;
  }
  if (level >= 10) {
    return ROTATE_RANGE;
  }
  const t = (level - 5) / 5;
  return ROTATE_RANGE * t;
}

export function getSpawnWaitMs(level) {
  const base = 4000;
  const step = 160;
  return Math.max(1000, Math.round(base - (level - 1) * step));
}

export function createGameState() {
  const level = 1;
  const toNextLevel = 10;
  const bonusInventory = loadBonusInventory();
  const state = {
    waitingBody: null,
    waitingState: "none",
    waitStartMs: 0,
    aimGuideBody: null,
    aimGuideFadeInStartMs: 0,
    aimGuideFadeOutStartMs: 0,
    moveLeft: false,
    moveRight: false,
    spawnBlockResumeAt: 0,
    gameOver: false,
    killTouchMs: 0,
    killGraceUntil: 0,
    killWarningActive: false,
    chainStates: [],
    chainShimmerEvents: [],
    chainShimmerProgressByBodyId: new Map(),
    debugPerf: null,
    chainGraceMs: 0,
    burstBodies: new Set(),
    viewScale: 1,
    viewWidth: 0,
    viewHeight: 0,
    paused: false,
    pausedReason: null,
    pausedAtMs: 0,
    pausedResumeMs: 0,
    gameOverHandled: false,
    gameOverBannerStartMs: 0,
    gameOverMenuTimer: 0,
    mode: "shell",
    nextSpec: createRandomSpec(getColorsCount(level), getRotationRange(level)),
    previewBody: null,
    previewStartMs: 0,
    score: 0,
    coins: loadCoins(),
    scoreCoef: 1,
    moneyCoef: 1,
    bonusDropChance: 0,
    bonusUpgradeLevel: 0,
    bonusCooldownMs: 0,
    removeAds: false,
    gameMultiplier: 1,
    comboMultiplier: 1,
    energy: 0,
    cosmoLevel: 1,
    cosmoColorFrom: null,
    cosmoColorTo: null,
    cosmoColorBlendStartMs: 0,
    cosmoPopups: [],
    comboStreak: 0,
    comboLastAtMs: 0,
    comboPopups: [],
    levelUpPopups: [],
    scoreParticles: [],
    bubbles: [],
    bubblePopParticles: [],
    bubblePopIcons: [],
    rewardFloaters: [],
    bubbleRewardCooldowns: {
      coins: 0,
      points1: 0,
      points2: 0,
      points3: 0,
      hail: 0,
      grenade: 0,
      touch: 0,
      gun: 0,
    },
    bubbleConsumableDrops: 0,
    bonusInventory: {
      touch: bonusInventory.touch,
      gun: bonusInventory.gun,
    },
    bonusCooldowns: {
      touchUntil: 0,
      gunUntil: 0,
    },
    bonusTouchActiveUntil: 0,
    bonusGunShots: [],
    bonusGunMarks: [],
    keyboardControlActive: false,
    keyboardControlMode: null,
    lastGameOverCoins: 0,
    lastGameOverStoredCoins: 0,
    tutorial: createTutorialState(),
    level,
    clearedThisLevel: 0,
    toNextLevel,
    colorsCount: getColorsCount(level),
    rotationRange: getRotationRange(level),
  };
  applyShopToGameState(state, getShopProgress());
  return state;
}

export function applyLevelProgress(state, removedCount) {
  if (!removedCount) {
    return { leveledUp: false, prevToNextLevel: state.toNextLevel };
  }
  state.clearedThisLevel += removedCount;
  if (state.clearedThisLevel < state.toNextLevel) {
    return { leveledUp: false, prevToNextLevel: state.toNextLevel };
  }
  const prevToNextLevel = state.toNextLevel;
  state.level += 1;
  state.clearedThisLevel = 0;
  state.toNextLevel = Math.floor(prevToNextLevel * 1.2);
  state.colorsCount = getColorsCount(state.level);
  state.rotationRange = getRotationRange(state.level);
  return { leveledUp: true, prevToNextLevel };
}
