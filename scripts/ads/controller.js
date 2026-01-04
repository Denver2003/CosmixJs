import { isAdLocked, isSdkReady, showInterstitialSafe, showRewardedSafe } from "./sdk_mock.js";

let adOpenCallback = null;
let adCloseCallback = null;

export function setAdCallbacks({ onOpen, onClose } = {}) {
  adOpenCallback = typeof onOpen === "function" ? onOpen : null;
  adCloseCallback = typeof onClose === "function" ? onClose : null;
}

export function canShowAds() {
  return isSdkReady() && !isAdLocked();
}

export async function playInterstitial() {
  if (!canShowAds()) {
    return false;
  }
  adOpenCallback?.();
  const ok = await showInterstitialSafe();
  adCloseCallback?.();
  return ok;
}

export async function playRewarded() {
  if (!canShowAds()) {
    return false;
  }
  adOpenCallback?.();
  const ok = await showRewardedSafe();
  adCloseCallback?.();
  return ok;
}
