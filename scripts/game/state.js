import { ROTATE_RANGE } from "../config.js";
import { createRandomSpec } from "../shapes.js";
import { loadCoins } from "./storage.js";

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
  return {
    waitingBody: null,
    waitingState: "none",
    waitStartMs: 0,
    moveLeft: false,
    moveRight: false,
    gameOver: false,
    killTouchMs: 0,
    chainStates: [],
    debugLogMs: 0,
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
    nextSpec: createRandomSpec(getColorsCount(level), getRotationRange(level)),
    previewBody: null,
    previewStartMs: 0,
    score: 0,
    coins: loadCoins(),
    scoreCoef: 1,
    moneyCoef: 1,
    gameMultiplier: 1,
    comboMultiplier: 1,
    comboStreak: 0,
    comboLastAtMs: 0,
    comboPopups: [],
    scoreParticles: [],
    level,
    clearedThisLevel: 0,
    toNextLevel,
    colorsCount: getColorsCount(level),
    rotationRange: getRotationRange(level),
  };
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
  console.log("[level] up:", state.level);
  return { leveledUp: true, prevToNextLevel };
}
