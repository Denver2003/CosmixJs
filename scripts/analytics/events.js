import { trackEvent } from "./index.js";

export function resolveInputMethod(pointerType) {
  if (pointerType === "mouse") {
    return "mouse";
  }
  if (pointerType === "touch") {
    return "touch";
  }
  if (pointerType === "pen") {
    return "pen";
  }
  return "unknown";
}

export function trackSessionStart({ sdkName, lang } = {}) {
  trackEvent("session_start", {
    sdk_name: sdkName || "unknown",
    lang: lang || "unknown",
  });
}

export function trackSessionEnd({ durationMs, reason } = {}) {
  trackEvent("session_end", {
    duration_ms: Math.max(0, Math.floor(durationMs || 0)),
    reason: reason || "unknown",
  });
}

export function trackScreenOpen(screenId) {
  if (!screenId) {
    return;
  }
  trackEvent("screen_open", { screen_id: String(screenId) });
}

export function trackOverlayOpen(overlayId) {
  if (!overlayId) {
    return;
  }
  trackEvent("overlay_open", { overlay_id: String(overlayId) });
}

export function trackUiClick({ screenId, controlId, inputMethod } = {}) {
  if (!controlId) {
    return;
  }
  trackEvent("ui_click", {
    screen_id: screenId || "unknown",
    control_id: String(controlId),
    input_method: inputMethod || "unknown",
  });
}

export function trackRunStart({ runId, source } = {}) {
  if (!runId) {
    return;
  }
  trackEvent("run_start", {
    run_id: String(runId),
    source: source || "unknown",
  });
}

export function trackRunEnd({
  runId,
  reason,
  durationMs,
  level,
  score,
  totalDrops,
} = {}) {
  if (!runId) {
    return;
  }
  trackEvent("run_end", {
    run_id: String(runId),
    reason: reason || "unknown",
    duration_ms: Math.max(0, Math.floor(durationMs || 0)),
    level: Math.max(1, Math.floor(level || 1)),
    score: Math.max(0, Math.floor(score || 0)),
    total_drops: Math.max(0, Math.floor(totalDrops || 0)),
  });
}

export function trackLevelUp({ runId, level } = {}) {
  if (!runId) {
    return;
  }
  trackEvent("level_up", {
    run_id: String(runId),
    level: Math.max(1, Math.floor(level || 1)),
  });
}

export function trackBonusUse({ runId, bonusId, source } = {}) {
  if (!runId || !bonusId) {
    return;
  }
  trackEvent("bonus_use", {
    run_id: String(runId),
    bonus_id: String(bonusId),
    source: source || "unknown",
  });
}

export function trackBonusAward({ runId, bonusId, source } = {}) {
  if (!runId || !bonusId) {
    return;
  }
  trackEvent("bonus_award", {
    run_id: String(runId),
    bonus_id: String(bonusId),
    source: source || "unknown",
  });
}

export function trackShopOpen() {
  trackEvent("shop_open", {});
}

export function trackShopPurchaseAttempt({ itemId, price, currency } = {}) {
  if (!itemId) {
    return;
  }
  const payload = {
    item_id: String(itemId),
    currency: currency || "coins",
  };
  if (Number.isFinite(price)) {
    payload.price = Math.max(0, Math.floor(price));
  }
  trackEvent("shop_purchase_attempt", payload);
}

export function trackShopPurchaseSuccess({ itemId, price, currency } = {}) {
  if (!itemId) {
    return;
  }
  const payload = {
    item_id: String(itemId),
    currency: currency || "coins",
  };
  if (Number.isFinite(price)) {
    payload.price = Math.max(0, Math.floor(price));
  }
  trackEvent("shop_purchase_success", payload);
}

export function trackShopPurchaseFail({ itemId, price, currency, reason } = {}) {
  if (!itemId) {
    return;
  }
  const payload = {
    item_id: String(itemId),
    currency: currency || "coins",
    reason: reason || "unknown",
  };
  if (Number.isFinite(price)) {
    payload.price = Math.max(0, Math.floor(price));
  }
  trackEvent("shop_purchase_fail", payload);
}

export function trackIapPurchaseAttempt({ productId } = {}) {
  if (!productId) {
    return;
  }
  trackEvent("iap_purchase_attempt", { product_id: String(productId) });
}

export function trackIapPurchaseSuccess({ productId } = {}) {
  if (!productId) {
    return;
  }
  trackEvent("iap_purchase_success", { product_id: String(productId) });
}

export function trackIapPurchaseFail({ productId, reason } = {}) {
  if (!productId) {
    return;
  }
  trackEvent("iap_purchase_fail", {
    product_id: String(productId),
    reason: reason || "unknown",
  });
}

export function trackShopRewardAttempt() {
  trackEvent("shop_reward_attempt", {});
}

export function trackShopRewardSuccess() {
  trackEvent("shop_reward_success", {});
}

export function trackShopRewardFail(reason) {
  trackEvent("shop_reward_fail", { reason: reason || "unknown" });
}

export function trackAdShow({ adType, placement } = {}) {
  if (!adType) {
    return;
  }
  trackEvent("ad_show", {
    ad_type: String(adType),
    placement: placement || "unknown",
  });
}

export function trackAdResult({ adType, placement, outcome } = {}) {
  if (!adType) {
    return;
  }
  trackEvent("ad_result", {
    ad_type: String(adType),
    placement: placement || "unknown",
    outcome: outcome || "unknown",
  });
}

export function trackLeaderboardSubmit({ leaderboardId, score, ok } = {}) {
  if (!leaderboardId) {
    return;
  }
  trackEvent("leaderboard_submit", {
    leaderboard_id: String(leaderboardId),
    score: Math.max(0, Math.floor(score || 0)),
    ok: Boolean(ok),
  });
}

export function trackCloudSaveSuccess() {
  trackEvent("cloud_save_success", {});
}

export function trackCloudSaveFail(reason) {
  trackEvent("cloud_save_fail", { reason: reason || "unknown" });
}
