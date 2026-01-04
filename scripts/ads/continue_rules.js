import { getContinueCount } from "./runtime.js";

const CONTINUE_PERCENTS = [0.7, 0.5, 0.3];

export function canContinueRun() {
  return getContinueCount() < CONTINUE_PERCENTS.length;
}

export function getContinuePercent() {
  const index = Math.min(getContinueCount(), CONTINUE_PERCENTS.length - 1);
  return CONTINUE_PERCENTS[index];
}

export function getContinueLabel() {
  if (canContinueRun()) {
    return "Continue (watch ad)";
  }
  return "No more continues";
}
