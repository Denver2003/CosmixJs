import { createGlass } from "./glass.js";
import { createGame } from "./game/index.js";
import { GLASS_HEIGHT, HUD_BOTTOM_RESERVE, HUD_TOP_RESERVE } from "./config.js";

const { Engine, Render, Runner } = Matter;

console.log("[main] init");

const engine = Engine.create();
const world = engine.world;

const canvas = document.getElementById("world");

function getViewportRect() {
  const viewport = window.visualViewport;
  if (viewport) {
    return {
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      offsetLeft: Math.round(viewport.offsetLeft || 0),
      offsetTop: Math.round(viewport.offsetTop || 0),
    };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    offsetLeft: 0,
    offsetTop: 0,
  };
}

const viewState = {
  width: 0,
  height: 0,
  scale: 1,
  pixelRatio: 1,
};

function computeView() {
  const {
    width: viewportWidth,
    height: viewportHeight,
    offsetLeft,
    offsetTop,
  } = getViewportRect();
  const viewHeight = GLASS_HEIGHT + HUD_TOP_RESERVE + HUD_BOTTOM_RESERVE;
  const scale = viewportHeight / viewHeight;
  const viewWidth = viewportWidth / scale;
  return {
    viewWidth,
    viewHeight,
    scale,
    viewportWidth,
    viewportHeight,
    offsetLeft,
    offsetTop,
  };
}

function applyViewSizing() {
  const {
    viewWidth,
    viewHeight,
    scale,
    viewportWidth,
    viewportHeight,
    offsetLeft,
    offsetTop,
  } =
    computeView();
  viewState.width = viewWidth;
  viewState.height = viewHeight;
  viewState.scale = scale;
  viewState.pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  canvas.style.left = `${offsetLeft}px`;
  canvas.style.top = `${offsetTop}px`;
  canvas.style.position = "absolute";
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${viewportHeight}px`;
  canvas.width = Math.round(viewportWidth * viewState.pixelRatio);
  canvas.height = Math.round(viewportHeight * viewState.pixelRatio);
  return { viewWidth, viewHeight, viewportWidth, viewportHeight };
}

const {
  viewWidth: canvasWidth,
  viewHeight: canvasHeight,
  viewportWidth,
  viewportHeight,
} = applyViewSizing();

const render = Render.create({
  canvas,
  engine,
  options: {
    width: viewportWidth,
    height: viewportHeight,
    pixelRatio: viewState.pixelRatio,
    wireframes: false,
    background: "#0f1115",
    wireframeBackground: "#0f1115",
  },
});
Render.lookAt(render, {
  min: { x: 0, y: 0 },
  max: { x: canvasWidth, y: canvasHeight },
});

const glass = createGlass(world, () => ({
  width: viewState.width,
  height: viewState.height,
}));
glass.build();

Render.run(render);

const runner = Runner.create();
Runner.run(runner, engine);

const game = createGame({
  engine,
  world,
  render,
  runner,
  getGlassRect: glass.getRect,
});
game.setViewScale(viewState.scale);
game.setViewSize(viewState.width, viewState.height);

game.start();

Matter.Events.on(engine, "afterUpdate", () => {
  game.tickAutoResume();
});

function handleResize() {
  const prevRect = glass.getRect();
  const { viewWidth, viewHeight, viewportWidth, viewportHeight } =
    applyViewSizing();
  scheduleAutoPause();
  render.canvas.width = Math.round(viewportWidth * viewState.pixelRatio);
  render.canvas.height = Math.round(viewportHeight * viewState.pixelRatio);
  render.options.width = Math.round(viewportWidth);
  render.options.height = Math.round(viewportHeight);
  Render.setPixelRatio(render, viewState.pixelRatio);
  Render.lookAt(render, {
    min: { x: 0, y: 0 },
    max: { x: viewWidth, y: viewHeight },
  });

  glass.build();
  const nextRect = glass.getRect();
  shiftBodies(prevRect, nextRect);
  game.onResize();
  game.setViewScale(viewState.scale);
  game.setViewSize(viewState.width, viewState.height);
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
  if (!game) {
    return;
  }
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
