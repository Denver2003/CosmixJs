import { createGlass } from "./glass.js";
import { createGame } from "./game/index.js";
import { createViewport } from "./view/viewport.js";
import { getFitViewHeight } from "./view/fit.js";

const { Engine, Render, Runner } = Matter;

console.log("[main] init");

const engine = Engine.create();
const world = engine.world;

const canvas = document.getElementById("world");
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
    background: "#0f1115",
    wireframeBackground: "#0f1115",
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

const runner = Runner.create();
Runner.run(runner, engine);

const game = createGame({
  engine,
  world,
  render,
  runner,
  getGlassRect: glass.getRect,
});
game.setViewScale(viewport.getState().scale);
game.setViewSize(viewport.getState().width, viewport.getState().height);

game.start();

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
