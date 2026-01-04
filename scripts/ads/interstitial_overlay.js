import { createOverlay } from "../shell/overlays.js";

export function createInterstitialOverlay(router) {
  const overlay = createOverlay("ads_interstitial");
  overlay.classList.add("ads-overlay");

  const panel = document.createElement("div");
  panel.className = "ads-overlay__panel";
  panel.textContent = "AD: Interstitial (mock)";
  overlay.appendChild(panel);

  router.registerOverlay("ads_interstitial", overlay);

  return {
    open() {
      router.pushOverlay("ads_interstitial");
    },
    close() {
      router.popOverlay();
    },
  };
}
