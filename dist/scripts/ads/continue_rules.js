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

export function getContinueLabel(skippersCount = 0) {
  if (!canContinueRun()) {
    return t("label.no_more_continues");
  }
  if (skippersCount > 0) {
    return t("label.continue_skipper");
  }
  return t("button.continue_ad");
}
