import { ROTATE_RANGE } from "../config.js";
import { createRandomSpec } from "../shapes.js";

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

export function createGameState() {
  const level = 1;
  const toNextLevel = 20;
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
    nextSpec: createRandomSpec(getColorsCount(level), getRotationRange(level)),
    previewBody: null,
    previewStartMs: 0,
    level,
    clearedThisLevel: 0,
    toNextLevel,
    colorsCount: getColorsCount(level),
    rotationRange: getRotationRange(level),
  };
}

export function applyLevelProgress(state, removedCount) {
  if (!removedCount) {
    return false;
  }
  state.clearedThisLevel += removedCount;
  if (state.clearedThisLevel < state.toNextLevel) {
    return false;
  }
  state.level += 1;
  state.clearedThisLevel = 0;
  state.toNextLevel = Math.floor(state.toNextLevel * 1.2);
  state.colorsCount = getColorsCount(state.level);
  state.rotationRange = getRotationRange(state.level);
  console.log("[level] up:", state.level);
  return true;
}
