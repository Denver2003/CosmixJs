import { ScreenId } from "./screens.js";
import { subscribeAppState } from "./app_state.js";
import { createHeaderBar, createIconButton, createPill, updatePill } from "./ui/header.js";

export function setupHomeScreen(screen, router, handlers = {}) {
  if (!screen) {
    return;
  }
  const userButton = createIconButton({ icon: "👤", label: "Guest" });
  const coinsPill = createPill({ icon: "💰", label: "Coins", value: "0" });
  const bestPill = createPill({ icon: "🏆", label: "Best", value: "0" });
  const header = createHeaderBar({
    left: [userButton],
    right: [coinsPill, bestPill],
  });
  screen.headerBar.replaceChildren(header.header);

  const content = document.createElement("div");
  content.className = "home-content";

  const hero = document.createElement("div");
  hero.className = "home-hero";

  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "home-play";
  playButton.textContent = "PLAY";
  playButton.addEventListener("click", () => {
    router.showScreen(ScreenId.GAME);
    if (typeof handlers.onPlay === "function") {
      handlers.onPlay();
    }
  });

  const subtitle = document.createElement("div");
  subtitle.className = "home-subtitle";
  subtitle.textContent = "Tap bubbles • Make combos";

  hero.appendChild(playButton);
  hero.appendChild(subtitle);
  content.appendChild(hero);
  screen.contentArea.replaceChildren(content);

  const footer = document.createElement("div");
  footer.className = "home-footer";
  footer.appendChild(
    createIconButton({
      icon: "🛒",
      label: "Shop",
      onClick: () => router.showScreen(ScreenId.SHOP),
    })
  );
  footer.appendChild(
    createIconButton({
      icon: "🏆",
      label: "Leaders",
      onClick: () => router.showScreen(ScreenId.LEADERBOARDS),
    })
  );
  footer.appendChild(
    createIconButton({
      icon: "⚙️",
      label: "Settings",
      onClick: () => router.showScreen(ScreenId.SETTINGS),
    })
  );
  screen.footerNav.replaceChildren(footer);

  subscribeAppState((next) => {
    const label = next.userName ? next.userName : "Guest";
    const labelNode = userButton.querySelector(".icon-button__label");
    if (labelNode) {
      labelNode.textContent = label;
    }
    updatePill(coinsPill, { value: next.coins });
    updatePill(bestPill, { value: next.bestScore });
  });
}
