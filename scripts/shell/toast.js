import { OverlayId } from "./overlays.js";

export function setupToast(router) {
  const overlay = router.getOverlay?.(OverlayId.TOAST);
  if (!overlay) {
    return null;
  }
  overlay.classList.add("toast-overlay");

  const toast = document.createElement("div");
  toast.className = "toast";
  overlay.appendChild(toast);

  let hideTimer = null;

  function show(message = "", durationMs = 2000) {
    toast.textContent = message;
    router.pushOverlay(OverlayId.TOAST);
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      router.popOverlay();
    }, durationMs);
  }

  return { show };
}
