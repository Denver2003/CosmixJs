import { createGlass } from "./glass.js";
import { createGame } from "./game/index.js";
import { createShell } from "./shell/index.js";
import { setAppState } from "./shell/app_state.js";
import { createViewport } from "./view/viewport.js";
import { getFitViewHeight } from "./view/fit.js";
import {
  handleShellPointer,
  beginShellDrag,
  updateShellDrag,
  handleShellWheel,
  isGameScreenActive,
  isShellHoverTarget,
} from "./ui/canvas_shell.js";
import {
  handleCanvasOverlayBack,
  handleCanvasOverlayPointer,
  isCanvasOverlayHover,
} from "./ui/canvas_overlays.js";
import { setLanguage, subscribeLanguage, t } from "./ui/i18n.js";
import { getCapsuleLayout } from "./ui/layout.js";
import {
  incrementSessionCount,
  resetContinueCount,
  setAdCallbacks,
  syncStickyBanner,
} from "./ads/index.js";
import { preloadAssets } from "./preload.js";
import { GLASS_HEIGHT, GLASS_WIDTH, HUD_TOP_RESERVE } from "./config.js";
import * as bonusUi from "./game/bonus_ui.js";
import { isBubbleHit } from "./game/bubbles.js";
import { isPauseButtonHover } from "./game/lines/hud.js";
import { initSdk, notifyGameReady, setSdkCallbacks } from "./sdk/index.js";
import { loadCloudState, queueCloudSave } from "./cloud/index.js";
import { applyCloudPayload, buildCloudPayload } from "./cloud/state.js";
import { syncSdkUser } from "./sdk/auth.js";
import { loadIapCatalog, syncIapPurchases } from "./shop/iap.js";
import { getShopProgress } from "./shop/progression.js";
import { ensureAudioUnlocked, playMusic, setMusicPaused } from "./audio/index.js";

const { Engine, Render } = Matter;

let engine = null;
let world = null;
let canvas = null;
let viewport = null;
let fitHeight = 0;
let render = null;
let glass = null;
let runner = null;
let game = null;
let shell = null;
let gameStarted = false;
const AUTO_RESUME_DELAY_MS = 1000;
let focusMusicPaused = false;
let focusResumeTimer = 0;
let focusWatchdogTimer = 0;
let lastWindowActive = true;

setSdkCallbacks({
  onPause: () => {
    if (!game?.setPaused) {
      return;
    }
    game.setPaused(true, "sdk");
  },
  onResume: () => {
    if (!game?.setPaused || !game?.getPauseInfo) {
      return;
    }
    const info = game.getPauseInfo();
    if (info?.paused && info.reason === "sdk") {
      game.setPaused(false, "sdk");
    }
  },
  onLanguage: (lang) => {
    if (lang) {
      setLanguage(lang);
    }
  },
});

subscribeLanguage(() => {
  if (typeof document !== "undefined") {
    document.title = t("app.page_title");
  }
});

bootstrap();

async function bootstrap() {
  canvas = document.getElementById("world");
  if (!canvas) {
    return;
  }
  initSdk().catch(() => {});
  const cloudPromise = loadCloudState();
  viewport = createViewport(canvas);
  fitHeight = getFitViewHeight();

  const loader = createLoader(canvas, viewport, fitHeight);
  await preloadAssets({
    onProgress: (info) => loader.update(info),
  });

  const cloudPayload = await cloudPromise;
  applyCloudPayload(cloudPayload);
  queueCloudSave(buildCloudPayload());
  syncStickyBanner(getShopProgress()?.removeAds);
  syncSdkUser();
  syncIapPurchases();
  loadIapCatalog();
  loader.stop();

  engine = Engine.create();
  world = engine.world;

  const {
    viewWidth: canvasWidth,
    viewHeight: canvasHeight,
    viewportWidth,
    viewportHeight,
  } = viewport.applyFitView(fitHeight);

  render = Render.create({
    canvas,
    engine,
    options: {
      width: viewportWidth,
      height: viewportHeight,
      pixelRatio: viewport.getState().pixelRatio,
      wireframes: false,
      background: "#000000",
      wireframeBackground: "#000000",
    },
  });
  Render.lookAt(render, {
    min: { x: 0, y: 0 },
    max: { x: canvasWidth, y: canvasHeight },
  });

  glass = createGlass(world, () => {
    const { width, height } = viewport.getState();
    return { width, height };
  });
  glass.build();

  Render.run(render);

  runner = { enabled: true, delta: 1000 / 60 };
  startFixedRunner(engine, runner);

  game = createGame({
    engine,
    world,
    render,
    runner,
    getGlassRect: glass.getRect,
  });
  game.setViewScale(viewport.getState().scale);
  game.setViewSize(viewport.getState().width, viewport.getState().height);
  playMusic("bgm_loop_1");

  gameStarted = false;
  shell = createShell({
    onPlay: () => {
      if (gameStarted) {
        return;
      }
      resetContinueCount();
      incrementSessionCount();
      game.start();
      gameStarted = true;
    },
    onPause: {
      resume: () => {
        game.setPaused(false, "manual");
      },
      restart: () => {
        game.restartSession?.();
      },
      home: () => {
        game.openShell?.();
        shell?.router?.showScreen?.("home");
      },
      shop: () => {
        game.openShell?.();
        shell?.router?.showScreen?.("shop");
      },
    },
    onGameOver: {
      retry: () => {
        game.restartSession?.();
      },
      home: () => {
        game.openShell?.();
        shell?.router?.showScreen?.("home");
      },
      shop: () => {
        game.openShell?.();
        shell?.router?.showScreen?.("shop");
      },
    },
  });
  if (shell?.router) {
    const originalShow = shell.router.showScreen.bind(shell.router);
    shell.router.showScreen = (id) => {
      originalShow(id);
      if (id === "game") {
        if (game.state?.gameOver) {
          if (!shell.router.__skipGameOverMenuOnce) {
            shell.gameOverMenu?.open?.();
          }
          shell.router.__skipGameOverMenuOnce = false;
          return;
        }
        if (gameStarted) {
          game.startGame?.();
        }
      } else {
        game.openShell?.();
        shell.pauseMenu?.close?.();
        shell.gameOverMenu?.close?.();
      }
    };
    window.__shellRouter = shell.router;
    window.__shellRoot = document.getElementById("shell-root");
    window.__overlayRoot = document.getElementById("overlay-root");
  }
  window.__canvasStartGame = () => {
    if (game.state?.gameOver && shell?.router) {
      shell.router.__skipGameOverMenuOnce = true;
    }
    if (shell?.router) {
      shell.router.showScreen("game");
    }
    if (game.state?.gameOver) {
      shell?.runRetryFlow?.();
      gameStarted = true;
      return;
    }
    if (!gameStarted) {
      resetContinueCount();
      incrementSessionCount();
      game.start();
      gameStarted = true;
    }
  };
  if (!gameStarted && game?.state?.tutorial && !game.state.tutorial.completed) {
    window.__canvasStartGame();
  }
  window.__applyShopState = (payload) => {
    game.applyShopState?.(payload);
  };
  window.__setBestScore = (score) => {
    if (!Number.isFinite(score)) {
      return;
    }
    setAppState({ bestScore: Math.max(0, Math.floor(score)) });
  };
  window.__setGameOver = (value = true) => {
    if (value) {
      game.setGameOver?.();
    } else {
      game.setPaused?.(false);
    }
  };
  window.__resumeAfterContinue = () => {
    game.resumeAfterContinue?.();
  };
  window.__gameState = game.state || null;
  window.__getGlassRect = glass.getRect;

  const canvasRect = () => canvas.getBoundingClientRect();
  const shopDrag = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastY: 0,
    moved: false,
  };
  canvas.addEventListener("pointerdown", (event) => {
    ensureAudioUnlocked();
    const rect = canvasRect();
    const scaleX = render.options.width / rect.width;
    const scaleY = render.options.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    if (
      handleCanvasOverlayPointer({
        x,
        y,
        render,
        state: game.state,
        isGameActive: isGameScreenActive(),
      })
    ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.pointerType === "touch" && beginShellDrag(x, y)) {
      shopDrag.active = true;
      shopDrag.pointerId = event.pointerId;
      shopDrag.startX = x;
      shopDrag.startY = y;
      shopDrag.lastY = y;
      shopDrag.moved = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (handleShellPointer(x, y, render)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!shopDrag.active || shopDrag.pointerId !== event.pointerId) {
      return;
    }
    const rect = canvasRect();
    const scaleY = render.options.height / rect.height;
    const y = (event.clientY - rect.top) * scaleY;
    const deltaY = y - shopDrag.lastY;
    if (Math.abs(y - shopDrag.startY) > 4) {
      shopDrag.moved = true;
    }
    shopDrag.lastY = y;
    if (updateShellDrag(-deltaY)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!shopDrag.active || shopDrag.pointerId !== event.pointerId) {
      return;
    }
    const rect = canvasRect();
    const scaleX = render.options.width / rect.width;
    const scaleY = render.options.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const wasMoved = shopDrag.moved;
    shopDrag.active = false;
    shopDrag.pointerId = null;
    if (!wasMoved) {
      if (handleShellPointer(x, y, render)) {
        event.preventDefault();
        event.stopPropagation();
      }
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  window.addEventListener("touchend", ensureAudioUnlocked, {
    capture: true,
    passive: true,
  });
  window.addEventListener("mousedown", ensureAudioUnlocked, {
    capture: true,
    passive: true,
  });
  canvas.addEventListener("pointercancel", (event) => {
    if (!shopDrag.active || shopDrag.pointerId !== event.pointerId) {
      return;
    }
    shopDrag.active = false;
    shopDrag.pointerId = null;
  });
  canvas.addEventListener(
    "wheel",
    (event) => {
      const rect = canvasRect();
      const scaleX = render.options.width / rect.width;
      const scaleY = render.options.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      let delta = event.deltaY;
      if (event.deltaMode === 1) {
        delta *= 16;
      } else if (event.deltaMode === 2) {
        delta *= rect.height;
      }
      if (handleShellWheel(x, y, delta * scaleY, render)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    { passive: false }
  );
  const updateCanvasCursor = (event) => {
    const rect = canvasRect();
    const scaleX = render.options.width / rect.width;
    const scaleY = render.options.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const isGameActive = isGameScreenActive();
    const overlayHover = isCanvasOverlayHover({
      x,
      y,
      render,
      state: game.state,
      isGameActive,
    });
    const shellHover = isShellHoverTarget(x, y, render);
    let gameHover = "";
    if (isGameActive && game?.state && glass?.getRect) {
      const state = game.state;
      const scale = state.viewScale || 1;
      const worldX = x / scale;
      const worldY = y / scale;
      const pauseHover = isPauseButtonHover(state, render, glass.getRect, x, y);
      const bonusHover =
        typeof bonusUi.hasHoverableBonusSlot === "function" &&
        bonusUi.hasHoverableBonusSlot(state, glass.getRect, worldX, worldY);
      const bubbleHover = isBubbleHit(state, worldX, worldY);
      const touchKillActive =
        state.bonusTouchActiveUntil &&
        state.engine?.timing?.timestamp < state.bonusTouchActiveUntil;
      const inGlass = isPointInGlass(render, glass.getRect, x, y);
      if (state.paused) {
        gameHover = pauseHover ? "pointer" : "";
      } else if (state.gameOver) {
        gameHover = pauseHover ? "pointer" : "";
      } else if (touchKillActive && inGlass) {
        gameHover = "pointer";
      } else if (bubbleHover || bonusHover || pauseHover) {
        gameHover = "pointer";
      } else if (inGlass) {
        gameHover = "ew-resize";
      }
    }
    const hoverCursor =
      overlayHover || shellHover ? "pointer" : gameHover || "";
    canvas.style.cursor = hoverCursor;
    if (typeof document !== "undefined") {
      document.body.style.cursor = hoverCursor;
    }
  };
  canvas.addEventListener("pointermove", updateCanvasCursor);
  window.addEventListener("pointermove", updateCanvasCursor);
  window.addEventListener("mousemove", updateCanvasCursor);
  canvas.addEventListener("pointerleave", () => {
    canvas.style.cursor = "";
    if (typeof document !== "undefined") {
      document.body.style.cursor = "";
    }
  });
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  if (shell) {
    window.shell = shell.router;
    window.shellPause = shell.pauseMenu;
    window.shellGameOver = shell.gameOverMenu;
  }

  setAdCallbacks({
    onOpen: () => {
      game.setPaused(true, "ad");
    },
    onClose: () => {
      const info = game.getPauseInfo?.();
      if (info?.paused && info.reason === "ad") {
        game.setPaused(false, "ad");
      }
    },
  });
  notifyGameReady().catch(() => {});

  window.addEventListener("resize", handleResize);
  window.visualViewport?.addEventListener("resize", handleResize);
  window.visualViewport?.addEventListener("scroll", handleResize);
  window.addEventListener("blur", handleFocusLoss);
  window.addEventListener("focus", handleFocusGain);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      handleFocusLoss();
    } else {
      handleFocusGain();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" && event.key !== "Backspace") {
      return;
    }
    if (isTypingTarget(event.target)) {
      return;
    }
    if (
      handleCanvasOverlayBack({
        state: game.state,
        isGameActive: isGameScreenActive(),
      })
    ) {
      event.preventDefault();
      return;
    }
    if (shell?.handleBack?.()) {
      event.preventDefault();
    }
  });

  window.openPauseMenu = openPauseMenu;
  startFocusWatchdog();
  Matter.Events.on(engine, "afterUpdate", () => {
    game.tickAutoResume();
  });
}

function createLoader(canvasElement, viewportInstance, fitHeightValue) {
  const ctx = canvasElement.getContext("2d");
  let viewRect = viewportInstance.applyFitView(fitHeightValue);
  let { pixelRatio, scale } = viewportInstance.getState();
  let progress = 0;
  let backgroundImage = null;
  let active = true;
  let frameId = 0;

  const resize = () => {
    viewRect = viewportInstance.applyFitView(fitHeightValue);
    ({ pixelRatio, scale } = viewportInstance.getState());
  };

  const draw = (time) => {
    if (!active) {
      return;
    }
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, viewRect.viewportWidth, viewRect.viewportHeight);
    drawLoaderBackground(ctx, viewRect, scale, backgroundImage);
    drawLoaderBar(ctx, viewRect, scale, progress, time);
    frameId = requestAnimationFrame(draw);
  };

  const onResize = () => resize();
  window.addEventListener("resize", onResize);
  window.visualViewport?.addEventListener("resize", onResize);
  window.visualViewport?.addEventListener("scroll", onResize);

  resize();
  frameId = requestAnimationFrame(draw);

  return {
    update(info) {
      progress = Math.max(0, Math.min(1, info?.progress ?? progress));
      if (info?.backgroundImage) {
        backgroundImage = info.backgroundImage;
      }
    },
    stop() {
      active = false;
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    },
  };
}

function drawLoaderBackground(ctx, viewRect, scale, backgroundImage) {
  ctx.save();
  const width = viewRect.viewportWidth;
  const height = viewRect.viewportHeight;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#05070c");
  gradient.addColorStop(1, "#0a1220");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const image =
    backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0
      ? backgroundImage
      : null;
  if (image) {
    const centerXWorld = getGlassCenterWorldX(viewRect.viewWidth);
    const centerYWorld = getGlassCenterWorldY();
    const targetHeight = viewRect.viewHeight;
    const worldScale = targetHeight / image.naturalHeight;
    const drawWidth = image.naturalWidth * worldScale;
    const drawHeight = image.naturalHeight * worldScale;
    const x = (centerXWorld - drawWidth / 2) * scale;
    const y = (centerYWorld - drawHeight / 2) * scale;
    ctx.drawImage(image, x, y, drawWidth * scale, drawHeight * scale);
  }
  ctx.restore();
}

function drawLoaderBar(ctx, viewRect, scale, progress, time) {
  const centerX = getGlassCenterWorldX(viewRect.viewWidth) * scale;
  const centerY = getGlassCenterWorldY() * scale;
  const maxWidth = viewRect.viewportWidth * 0.8;
  const baseWidth = GLASS_WIDTH * scale * 0.7;
  const barWidth = Math.min(baseWidth, maxWidth);
  const barHeight = Math.max(8, Math.round(barWidth * 0.06));
  const radius = barHeight / 2;
  const x = centerX - barWidth / 2;
  const y = centerY - barHeight / 2;

  ctx.save();
  ctx.fillStyle = "rgba(8, 12, 18, 0.7)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = Math.max(1, Math.round(barHeight * 0.1));
  roundRect(ctx, x, y, barWidth, barHeight, radius);
  ctx.fill();
  ctx.stroke();

  if (progress > 0) {
    const fillWidth = Math.max(radius * 2, barWidth * progress);
    ctx.save();
    roundRect(ctx, x, y, barWidth, barHeight, radius);
    ctx.clip();
    const fill = ctx.createLinearGradient(x, y, x + barWidth, y);
    fill.addColorStop(0, "#00e5ff");
    fill.addColorStop(1, "#00ff85");
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, fillWidth, barHeight);

    const shimmerWidth = barWidth * 0.25;
    const shimmerX =
      x +
      ((time / 1000) * 0.45 % 1) * (barWidth + shimmerWidth) -
      shimmerWidth;
    const shimmer = ctx.createLinearGradient(
      shimmerX,
      y,
      shimmerX + shimmerWidth,
      y
    );
    shimmer.addColorStop(0, "rgba(255, 255, 255, 0)");
    shimmer.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
    shimmer.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = shimmer;
    ctx.fillRect(shimmerX, y, shimmerWidth, barHeight);
    ctx.restore();
  }
  ctx.restore();
}

function getGlassCenterWorldX(viewWidth) {
  const left = (viewWidth - GLASS_WIDTH) / 2;
  return left + GLASS_WIDTH / 2;
}

function getGlassCenterWorldY() {
  return HUD_TOP_RESERVE + GLASS_HEIGHT / 2;
}

function isPointInGlass(render, getGlassRect, x, y) {
  const capsule = getCapsuleLayout(render, getGlassRect);
  if (!capsule?.inner) {
    return false;
  }
  const inner = capsule.inner;
  return (
    x >= inner.x &&
    x <= inner.x + inner.width &&
    y >= inner.y &&
    y <= inner.y + inner.height
  );
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, height / 2, width / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function openPauseMenu() {
  if (game.getPauseInfo?.().paused) {
    return;
  }
  if (typeof game.getMode === "function" && game.getMode() !== "gameplay") {
    return;
  }
  game.setPaused(true, "manual");
  shell?.pauseMenu?.open();
}

function handleResize() {
  const prevRect = glass.getRect();
  const { viewWidth, viewHeight, viewportWidth, viewportHeight } =
    viewport.applyFitView(fitHeight);
  scheduleAutoPause();
  const { pixelRatio, scale, width, height } = viewport.getState();
  render.canvas.width = Math.round(viewportWidth * pixelRatio);
  render.canvas.height = Math.round(viewportHeight * pixelRatio);
  render.options.width = Math.round(viewportWidth);
  render.options.height = Math.round(viewportHeight);
  Render.setPixelRatio(render, pixelRatio);
  Render.lookAt(render, {
    min: { x: 0, y: 0 },
    max: { x: viewWidth, y: viewHeight },
  });

  glass.build();
  const nextRect = glass.getRect();
  shiftBodies(prevRect, nextRect);
  game.onResize();
  game.setViewScale(scale);
  game.setViewSize(width, height);
}

function shiftBodies(prevRect, nextRect) {
  const dx = nextRect.left - prevRect.left;
  const dy = nextRect.top - prevRect.top;
  if (!dx && !dy) {
    return;
  }
  const bodies = Matter.Composite.allBodies(world);
  for (const body of bodies) {
    if (body.parent !== body) {
      continue;
    }
    if (body.plugin?.isGlass) {
      continue;
    }
    Matter.Body.translate(body, { x: dx, y: dy });
  }
}

function scheduleAutoPause() {
  game.setPaused(true, "resize", 3000);
  window.clearTimeout(scheduleAutoPause.resumeTimer);
  scheduleAutoPause.resumeTimer = window.setTimeout(() => {
    game.resumeIfAuto();
  }, 3000);
}

function scheduleAutoResume() {
  const pauseInfo = game.getPauseInfo?.();
  if (!pauseInfo?.paused || pauseInfo.reason !== "focus") {
    return;
  }
  if (!isWindowActive()) {
    clearAutoResumeTimer();
    return;
  }
  game.setPaused(true, "focus", AUTO_RESUME_DELAY_MS);
  window.clearTimeout(scheduleAutoResume.resumeTimer);
  scheduleAutoResume.resumeTimer = window.setTimeout(() => {
    if (!isWindowActive()) {
      return;
    }
    game.resumeIfAuto();
  }, AUTO_RESUME_DELAY_MS);
}

function handleFocusLoss() {
  lastWindowActive = false;
  clearAutoResumeTimer();
  game.setPaused(true, "focus");
  pauseMusicForFocus();
}

function handleFocusGain() {
  lastWindowActive = true;
  scheduleAutoResume();
  resumeMusicForFocusWithDelay();
}

function pauseMusicForFocus() {
  clearFocusResumeTimer();
  focusMusicPaused = true;
  setMusicPaused(true);
}

function resumeMusicForFocusWithDelay() {
  if (!focusMusicPaused) {
    return;
  }
  if (!isWindowActive()) {
    clearFocusResumeTimer();
    return;
  }
  clearFocusResumeTimer();
  focusResumeTimer = window.setTimeout(() => {
    focusResumeTimer = 0;
    if (!focusMusicPaused || !isWindowActive()) {
      return;
    }
    const pauseInfo = game?.getPauseInfo?.();
    if (pauseInfo?.paused && pauseInfo.reason !== "focus") {
      return;
    }
    focusMusicPaused = false;
    setMusicPaused(false);
  }, AUTO_RESUME_DELAY_MS);
}

function startFixedRunner(engineInstance, runnerState) {
  let lastTime = null;
  let accumulator = 0;
  const stepMs = runnerState.delta;
  const maxSteps = 5;
  const maxFrameDelta = stepMs * maxSteps;
  const resetAfterMs = 1000;

  function tick(time) {
    if (lastTime === null) {
      lastTime = time;
    }
    const rawDelta = time - lastTime;
    lastTime = time;
    if (runnerState.enabled) {
      if (rawDelta > resetAfterMs) {
        accumulator = 0;
      }
      const frameDelta = Math.min(rawDelta, maxFrameDelta);
      accumulator += frameDelta;
      let steps = 0;
      while (accumulator >= stepMs && steps < maxSteps) {
        Matter.Engine.update(engineInstance, stepMs);
        accumulator -= stepMs;
        steps += 1;
      }
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function isTypingTarget(target) {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function isWindowActive() {
  if (typeof document === "undefined") {
    return true;
  }
  if (document.hidden) {
    return false;
  }
  if (typeof document.hasFocus === "function") {
    return document.hasFocus();
  }
  return true;
}

function syncWindowFocusState() {
  const active = isWindowActive();
  if (active === lastWindowActive) {
    return;
  }
  lastWindowActive = active;
  if (active) {
    handleFocusGain();
  } else {
    handleFocusLoss();
  }
}

function startFocusWatchdog() {
  window.clearInterval(focusWatchdogTimer);
  lastWindowActive = isWindowActive();
  focusWatchdogTimer = window.setInterval(syncWindowFocusState, 250);
}

function clearAutoResumeTimer() {
  window.clearTimeout(scheduleAutoResume.resumeTimer);
  scheduleAutoResume.resumeTimer = 0;
  clearFocusResumeTimer();
  if (game?.state?.pausedReason === "focus") {
    game.state.pausedResumeMs = 0;
  }
}

function clearFocusResumeTimer() {
  window.clearTimeout(focusResumeTimer);
  focusResumeTimer = 0;
}
