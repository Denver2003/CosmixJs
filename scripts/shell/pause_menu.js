import { OverlayId } from "./overlays.js";
import { createIconButton } from "./ui/header.js";

export function setupPauseMenu(router, handlers = {}) {
  const overlay = router.getOverlay?.(OverlayId.PAUSE);
  if (!overlay) {
    return null;
  }
  overlay.classList.add("pause-overlay");

  const panel = document.createElement("div");
  panel.className = "pause-menu";

  const title = document.createElement("div");
  title.className = "pause-menu__title";
  title.textContent = "Paused";

  const buttons = document.createElement("div");
  buttons.className = "pause-menu__buttons";

  const resume = createIconButton({
    icon: "▶",
    label: "Resume",
    onClick: () => {
      router.popOverlay();
      handlers.onResume?.();
    },
  });
  const restart = createIconButton({
    icon: "⟲",
    label: "Restart",
    onClick: () => {
      router.popOverlay();
      handlers.onRestart?.();
    },
  });
  const home = createIconButton({
    icon: "⌂",
    label: "Home",
    onClick: () => {
      router.popOverlay();
      router.showScreen("home");
      handlers.onHome?.();
    },
  });
  const shop = createIconButton({
    icon: "🛒",
    label: "Shop",
    onClick: () => {
      router.popOverlay();
      router.showScreen("shop");
      handlers.onShop?.();
    },
  });

  buttons.appendChild(resume);
  buttons.appendChild(restart);
  buttons.appendChild(home);
  buttons.appendChild(shop);

  panel.appendChild(title);
  panel.appendChild(buttons);
  overlay.appendChild(panel);

  return {
    open() {
      router.pushOverlay(OverlayId.PAUSE);
    },
    close() {
      router.popOverlay();
    },
  };
}
