import { OverlayId } from "./overlays.js";

export function setupLoading(router) {
  const overlay = router.getOverlay?.(OverlayId.LOADING);
  if (!overlay) {
    return null;
  }
  overlay.classList.add("loading-overlay");
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.textContent = "Loading…";
  overlay.appendChild(spinner);

  return {
    show() {
      router.pushOverlay(OverlayId.LOADING);
    },
    hide() {
      router.popOverlay();
    },
  };
}
