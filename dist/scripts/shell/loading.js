import { OverlayId } from "./overlays.js";
import { subscribeLanguage, t } from "../ui/i18n.js";

export function setupLoading(router) {
  const overlay = router.getOverlay?.(OverlayId.LOADING);
  if (!overlay) {
    return null;
  }
  overlay.classList.add("loading-overlay");
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.textContent = t("loading");
  overlay.appendChild(spinner);

  subscribeLanguage(() => {
    spinner.textContent = t("loading");
  });

  return {
    show() {
      router.pushOverlay(OverlayId.LOADING);
    },
    hide() {
      router.popOverlay();
    },
  };
}
