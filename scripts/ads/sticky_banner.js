import { getSdk, initSdk } from "../sdk/index.js";

let lastRemoveAds = null;

export async function syncStickyBanner(removeAds) {
  const shouldHide = Boolean(removeAds);
  if (lastRemoveAds === shouldHide) {
    return { ok: true, changed: false };
  }
  lastRemoveAds = shouldHide;
  if (!shouldHide) {
    return { ok: true, changed: false };
  }
  await initSdk();
  const sdk = getSdk();
  if (typeof sdk?.ads?.hideBanner !== "function") {
    return { ok: false, changed: false };
  }
  try {
    await sdk.ads.hideBanner();
    return { ok: true, changed: true };
  } catch (error) {
    return { ok: false, changed: false };
  }
}
