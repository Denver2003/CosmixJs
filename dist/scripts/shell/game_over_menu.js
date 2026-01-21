import { OverlayId } from "./overlays.js";
import { createIconButton, setIconButtonLabel } from "./ui/header.js";
import { subscribeLanguage, t } from "../ui/i18n.js";

export function setupGameOverMenu(router, handlers = {}) {
  const overlay = router.getOverlay?.(OverlayId.GAME_OVER);
  if (!overlay) {
    return null;
  }
  overlay.classList.add("gameover-overlay");

  const panel = document.createElement("div");
  panel.className = "gameover-menu";

  const title = document.createElement("div");
  title.className = "gameover-menu__title";
  title.textContent = t("game_over.title");

  const buttons = document.createElement("div");
  buttons.className = "gameover-menu__buttons";

  const continueButton = createIconButton({
    icon: "▶",
    label: t("button.continue_ad"),
    onClick: () => {
      handlers.onContinue?.(continueButton);
    },
  });
  const retry = createIconButton({
    icon: "⟲",
    label: t("button.retry"),
    onClick: () => {
      router.popOverlay();
      handlers.onRetry?.();
    },
  });
  const home = createIconButton({
    icon: "⌂",
    label: t("button.home"),
    onClick: () => {
      router.popOverlay();
      router.showScreen("home");
      handlers.onHome?.();
    },
  });
  const shop = createIconButton({
    icon: "🛒",
    label: t("button.shop"),
    onClick: () => {
      router.popOverlay();
      router.showScreen("shop");
      handlers.onShop?.();
    },
  });

  buttons.appendChild(continueButton);
  buttons.appendChild(retry);
  buttons.appendChild(home);
  buttons.appendChild(shop);

  panel.appendChild(title);
  panel.appendChild(buttons);
  overlay.appendChild(panel);

  const applyTranslations = () => {
    title.textContent = t("game_over.title");
    setIconButtonLabel(retry, t("button.retry"));
    setIconButtonLabel(home, t("button.home"));
    setIconButtonLabel(shop, t("button.shop"));
  };

  subscribeLanguage(applyTranslations);

  return {
    open() {
      router.pushOverlay(OverlayId.GAME_OVER);
    },
    close() {
      router.popOverlay();
    },
    setContinueState({ visible = true, disabled = false, label } = {}) {
      continueButton.style.display = visible ? "" : "none";
      continueButton.disabled = Boolean(disabled);
      if (label) {
        setIconButtonLabel(continueButton, label);
      }
    },
  };
}
