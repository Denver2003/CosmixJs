import { getContinueCount } from "./runtime.js";
import { t } from "../ui/i18n.js";

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
    return t("button.continue_ad");
  }
  return t("label.no_more_continues");
}
