import { ScreenRouter } from "./router.js";
import { createScreen, ScreenId } from "./screens.js";
import { createOverlay, OverlayId } from "./overlays.js";
import { createDebugPanel } from "./debug.js";
import { setupHomeScreen } from "./home.js";
import { setupShopScreen } from "./shop.js";
import { setupSettingsScreen } from "./settings.js";
import { setupConfirmDialog } from "./confirm_dialog.js";
import { setupLeaderboardsScreen } from "./leaderboards.js";
import { setupLoading } from "./loading.js";
import { setupToast } from "./toast.js";
import { setupPauseMenu } from "./pause_menu.js";
import { setupGameOverMenu } from "./game_over_menu.js";

export function createShell({ onPlay, onPause, onGameOver } = {}) {
  const shellRoot = document.getElementById("shell-root");
  const overlayRoot = document.getElementById("overlay-root");
  if (!shellRoot || !overlayRoot) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const debugEnabled = params.get("debug") === "1";
  const router = new ScreenRouter({
    shellRoot,
    overlayRoot,
    defaultScreen: ScreenId.HOME,
    keepShellOnGame: debugEnabled,
  });

  const screens = [
    createScreen(ScreenId.HOME),
    createScreen(ScreenId.SHOP),
    createScreen(ScreenId.SETTINGS),
    createScreen(ScreenId.LEADERBOARDS),
  ];
  for (const screen of screens) {
    router.registerScreen(screen.dataset.screen, screen);
  }
  const homeScreen = screens.find((screen) => screen.dataset.screen === ScreenId.HOME);
  setupHomeScreen(homeScreen, router, { onPlay });
  const shopScreen = screens.find((screen) => screen.dataset.screen === ScreenId.SHOP);
  setupShopScreen(shopScreen, router);
  const overlays = [
    createOverlay(OverlayId.CONFIRM),
    createOverlay(OverlayId.TOAST),
    createOverlay(OverlayId.LOADING),
    createOverlay(OverlayId.PAUSE),
    createOverlay(OverlayId.GAME_OVER),
  ];
  for (const overlay of overlays) {
    router.registerOverlay(overlay.dataset.overlay, overlay);
  }
  setupToast(router);
  setupLoading(router);
  const confirmDialog = setupConfirmDialog(router);
  const settingsScreen = screens.find((screen) => screen.dataset.screen === ScreenId.SETTINGS);
  setupSettingsScreen(settingsScreen, router, confirmDialog);
  const leaderboardsScreen = screens.find((screen) => screen.dataset.screen === ScreenId.LEADERBOARDS);
  setupLeaderboardsScreen(leaderboardsScreen, router);

  const pauseMenu = setupPauseMenu(router, {
    onResume: onPause?.resume,
    onRestart: onPause?.restart,
    onHome: onPause?.home,
    onShop: onPause?.shop,
  });
  const gameOverMenu = setupGameOverMenu(router, {
    onRetry: onGameOver?.retry,
    onHome: onGameOver?.home,
    onShop: onGameOver?.shop,
  });

  if (debugEnabled) {
    shellRoot.classList.remove("is-hidden");
    shellRoot.dataset.debug = "1";
    shellRoot.appendChild(createDebugPanel(router));
    const pauseButton = document.createElement("button");
    pauseButton.type = "button";
    pauseButton.className = "icon-button debug-panel__button";
    pauseButton.textContent = "PAUSE";
    pauseButton.addEventListener("click", () => pauseMenu?.open());
    shellRoot.querySelector(".debug-panel")?.appendChild(pauseButton);
  }

  router.showScreen(ScreenId.HOME);
  overlayRoot.classList.add("is-hidden");

  return { router, pauseMenu, gameOverMenu };
}

export { ScreenId, OverlayId };
