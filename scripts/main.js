import { createGlass } from "./glass.js";
import { createGame } from "./game/index.js";
import { createShell } from "./shell/index.js";
import { setAppState } from "./shell/app_state.js";
import { createViewport } from "./view/viewport.js";
import { getFitViewHeight } from "./view/fit.js";
import { handleShellPointer, isGameScreenActive } from "./ui/canvas_shell.js";
import {
  handleCanvasOverlayBack,
  handleCanvasOverlayPointer,
} from "./ui/canvas_overlays.js";
import { incrementSessionCount, resetContinueCount, setAdCallbacks } from "./ads/index.js";

const { Engine, Render } = Matter;

const engine = Engine.create();
const world = engine.world;

const canvas = document.getElementById("world");
if (document.fonts?.load) {
  document.fonts.load("16px RussoOne");
}
const viewport = createViewport(canvas);
const fitHeight = getFitViewHeight();
const {
  viewWidth: canvasWidth,
  viewHeight: canvasHeight,
  viewportWidth,
  viewportHeight,
} = viewport.applyFitView(fitHeight);

const render = Render.create({
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

const glass = createGlass(world, () => {
  const { width, height } = viewport.getState();
  return { width, height };
});
glass.build();

Render.run(render);

const runner = { enabled: true, delta: 1000 / 60 };
startFixedRunner(engine, runner);

const game = createGame({
  engine,
  world,
  render,
  runner,
  getGlassRect: glass.getRect,
});
game.setViewScale(viewport.getState().scale);
game.setViewSize(viewport.getState().width, viewport.getState().height);

let gameStarted = false;
const shell = createShell({
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
canvas.addEventListener("pointerdown", (event) => {
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
  if (handleShellPointer(x, y, render)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
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

window.openPauseMenu = openPauseMenu;

Matter.Events.on(engine, "afterUpdate", () => {
  game.tickAutoResume();
});

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

window.addEventListener("resize", handleResize);
window.visualViewport?.addEventListener("resize", handleResize);
window.visualViewport?.addEventListener("scroll", handleResize);
window.addEventListener("blur", () => {
  game.setPaused(true, "focus");
});
window.addEventListener("focus", scheduleAutoResume);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    game.setPaused(true, "focus");
  } else {
    scheduleAutoResume();
  }
});

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
  game.setPaused(true, "focus", 3000);
  window.clearTimeout(scheduleAutoResume.resumeTimer);
  scheduleAutoResume.resumeTimer = window.setTimeout(() => {
    game.resumeIfAuto();
  }, 3000);
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
