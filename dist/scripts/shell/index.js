import { ScreenRouter } from "./router.js";
import { createScreen, ScreenId } from "./screens.js";
import { createOverlay, OverlayId } from "./overlays.js";
import { createDebugPanel } from "./debug.js";
import { setupHomeScreen } from "./home.js";
import { setupShopScreen } from "./shop.js";
import { setupSettingsScreen } from "./settings.js";
import { setupCanvasConfirmDialog, setupCanvasGameOverMenu, setupCanvasPauseMenu } from "../ui/canvas_overlays.js";
import { setupLeaderboardsScreen } from "./leaderboards.js";
import { setupLoading } from "./loading.js";
import { setupToast } from "./toast.js";
import { createInterstitialOverlay } from "../ads/interstitial_overlay.js";
import { subscribeLanguage } from "../ui/i18n.js";
import { getAppState, setAppState } from "./app_state.js";
import {
  canContinueRun,
  canShowAds,
  getContinueLabel,
  getContinuePercent,
  getAdsState,
  incrementContinueCount,
  incrementSessionCount,
  markInterstitialShown,
  playRewarded,
  playInterstitial,
  resetContinueCount,
} from "../ads/index.js";
import { applyContinueCleanup } from "../game/continue_cleanup.js";
import { getShopProgress } from "../shop/progression.js";
import { saveSkippers } from "../game/storage.js";
import { queueCloudSave } from "../cloud/index.js";
import { buildCloudPayload } from "../cloud/state.js";

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
  const interstitialOverlay = createInterstitialOverlay(router);
  setupToast(router);
  setupLoading(router);
  const confirmDialog = setupCanvasConfirmDialog();
  const settingsScreen = screens.find((screen) => screen.dataset.screen === ScreenId.SETTINGS);
  setupSettingsScreen(settingsScreen, router, confirmDialog);
  const leaderboardsScreen = screens.find((screen) => screen.dataset.screen === ScreenId.LEADERBOARDS);
  setupLeaderboardsScreen(leaderboardsScreen, router);

  const runRetryFlow = async () => {
    resetContinueCount();
    const progress = getShopProgress();
    const now = Date.now();
    const adsState = getAdsState();
    const sessionCount = adsState?.sessionCount || 0;
    const lastInterstitialAt = adsState?.lastInterstitialAt || 0;
    const canShowInterstitial =
      !progress?.removeAds &&
      canShowAds() &&
      sessionCount >= 3 &&
      now - lastInterstitialAt >= 180000;

    if (canShowInterstitial) {
      interstitialOverlay?.open();
      await playInterstitial();
      interstitialOverlay?.close();
      markInterstitialShown(now);
    }

    incrementSessionCount();
    onGameOver?.retry?.();
  };

  const pauseMenu = setupCanvasPauseMenu({
    onResume: onPause?.resume,
    onRestart: onPause?.restart,
    onHome: onPause?.home,
    onShop: onPause?.shop,
  });
  const gameOverMenu = setupCanvasGameOverMenu({
    onContinue: async () => {
      if (!canContinueRun()) {
        gameOverMenu.setContinueState({
          visible: true,
          disabled: true,
          label: getContinueLabel(),
        });
        return;
      }
      const appState = getAppState();
      const skippers = appState.skippers ?? 0;
      if (skippers > 0) {
        const nextSkippers = Math.max(0, Math.floor(skippers - 1));
        saveSkippers(nextSkippers);
        setAppState({ skippers: nextSkippers });
        queueCloudSave(buildCloudPayload());
      } else {
        const ok = await playRewarded();
        if (!ok) {
          return;
        }
      }
      const percent = getContinuePercent();
      incrementContinueCount();
      const state = window.__gameState;
      const getGlassRect = window.__getGlassRect;
      if (state && getGlassRect) {
        applyContinueCleanup(state, percent, getGlassRect);
        state.killTouchMs = 0;
        state.killGraceUntil = state.engine.timing.timestamp + 2500;
      }
      gameOverMenu.close();
      if (typeof window.__setGameOver === "function") {
        window.__setGameOver(false);
      }
      if (typeof window.__resumeAfterContinue === "function") {
        window.__resumeAfterContinue();
      }
    },
    onRetry: async () => {
      await runRetryFlow();
    },
    onHome: onGameOver?.home,
    onShop: onGameOver?.shop,
  });

  const updateContinueUi = () => {
    if (!gameOverMenu?.setContinueState) {
      return;
    }
    const skippers = getAppState().skippers ?? 0;
    if (skippers <= 0 && !canShowAds()) {
      gameOverMenu.setContinueState({ visible: false });
      return;
    }
    if (!canContinueRun()) {
      gameOverMenu.setContinueState({
        visible: true,
        disabled: true,
        label: getContinueLabel(skippers),
      });
      return;
    }
    gameOverMenu.setContinueState({
      visible: true,
      disabled: false,
      label: getContinueLabel(skippers),
    });
  };

  subscribeLanguage(() => {
    updateContinueUi();
  });

  if (gameOverMenu?.open) {
    const originalOpen = gameOverMenu.open.bind(gameOverMenu);
    gameOverMenu.open = () => {
      updateContinueUi();
      originalOpen();
    };
  }

  if (debugEnabled) {
    shellRoot.classList.remove("is-hidden");
    shellRoot.dataset.debug = "1";
    shellRoot.appendChild(createDebugPanel(router));
    const pauseButton = document.createElement("button");
    pauseButton.type = "button";
    pauseButton.className = "icon-button debug-panel__button";
    pauseButton.textContent = "PAUSE";
    pauseButton.addEventListener("click", () => {
      if (typeof window !== "undefined" && window.openPauseMenu) {
        window.openPauseMenu();
      } else {
        pauseMenu?.open?.();
      }
    });
    shellRoot.querySelector(".debug-panel")?.appendChild(pauseButton);
  }

  router.showScreen(ScreenId.HOME);
  overlayRoot.classList.add("is-hidden");

  return { router, pauseMenu, gameOverMenu, runRetryFlow };
}

export { ScreenId, OverlayId };
