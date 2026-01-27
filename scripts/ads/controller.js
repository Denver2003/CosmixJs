import { getSdk } from "../sdk/index.js";
import { trackAdResult, trackAdShow } from "../analytics/events.js";

let adOpenCallback = null;
let adCloseCallback = null;

export function setAdCallbacks({ onOpen, onClose } = {}) {
  adOpenCallback = typeof onOpen === "function" ? onOpen : null;
  adCloseCallback = typeof onClose === "function" ? onClose : null;
}

export function canShowAds() {
  const sdk = getSdk();
  return Boolean(sdk?.ads?.isAvailable?.());
}

export async function playInterstitial({ placement } = {}) {
  trackAdShow({ adType: "interstitial", placement });
  if (!canShowAds()) {
    trackAdResult({ adType: "interstitial", placement, outcome: "unavailable" });
    return false;
  }
  const sdk = getSdk();
  adOpenCallback?.();
  let ok = false;
  try {
    ok = await sdk.ads.showInterstitial();
  } catch (error) {
    ok = false;
  }
  adCloseCallback?.();
  trackAdResult({
    adType: "interstitial",
    placement,
    outcome: ok ? "success" : "fail",
  });
  return Boolean(ok);
}

export async function playRewarded({ placement } = {}) {
  trackAdShow({ adType: "rewarded", placement });
  if (!canShowAds()) {
    trackAdResult({ adType: "rewarded", placement, outcome: "unavailable" });
    return false;
  }
  const sdk = getSdk();
  adOpenCallback?.();
  let ok = false;
  try {
    ok = await sdk.ads.showRewarded();
  } catch (error) {
    ok = false;
  }
  adCloseCallback?.();
  trackAdResult({
    adType: "rewarded",
    placement,
    outcome: ok ? "success" : "fail",
  });
  return Boolean(ok);
}
