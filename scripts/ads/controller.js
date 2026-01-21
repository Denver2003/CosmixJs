import { getSdk } from "../sdk/index.js";

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

export async function playInterstitial() {
  if (!canShowAds()) {
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
  return Boolean(ok);
}

export async function playRewarded() {
  if (!canShowAds()) {
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
  return Boolean(ok);
}
