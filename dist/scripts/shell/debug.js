import { ScreenId } from "./screens.js";

const SCREEN_LABELS = [
  { id: ScreenId.HOME, label: "HOME" },
  { id: ScreenId.SHOP, label: "SHOP" },
  { id: ScreenId.SETTINGS, label: "SETTINGS" },
  { id: ScreenId.LEADERBOARDS, label: "LEADERS" },
  { id: ScreenId.GAME, label: "GAME" },
];

export function createDebugPanel(router) {
  const panel = document.createElement("div");
  panel.className = "debug-panel";

  for (const item of SCREEN_LABELS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button debug-panel__button";
    button.textContent = item.label;
    button.addEventListener("click", () => {
      router.showScreen(item.id);
    });
    panel.appendChild(button);
  }

  return panel;
}
