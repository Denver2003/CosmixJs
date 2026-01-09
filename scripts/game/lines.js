import {
  DEBUG_OVERLAY,
  GLASS_HEIGHT,
  GLASS_WIDTH,
  KILL_DURATION_MS,
  KILL_OFFSET,
  SPAWN_OFFSET,
} from "../config.js";
import { drawScoreParticles } from "./score_particles.js";
import { drawComboPopups } from "./combo_popup.js";
import {
  drawBubbles,
  drawBubblePopIcons,
  drawBubblePopParticles,
} from "./bubbles.js";
import { drawGunMarks } from "./bonuses.js";
import { drawLaserBarrier } from "./laser_barrier.js";
import { drawRewardFloaters } from "./reward_floaters.js";
import { drawBackground } from "./background.js";
import { drawGlassFrame } from "./glass_frame.js";
import { drawGameOverBanner } from "./game_over_banner_canvas.js";
import {
  drawBonusButtons,
  drawBubbleKeyHint,
} from "./draw/bonus_ui.js";
import { drawLevelUpPopups } from "./level_up_popup.js";
import { drawAimGuides, drawCustomOutlines, drawWaitFill } from "./lines/world.js";
import { drawCanvasUiScreen, drawCanvasUiWorld } from "../ui/canvas_ui.js";

const { Render } = Matter;

export function drawLines(state, render, getGlassRect) {
  const { left, top } = getGlassRect();
  const spawnY = top + SPAWN_OFFSET;
  const killY = top + KILL_OFFSET;

  const ctx = render.context;
  ctx.save();
  Render.startViewTransform(render);
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  drawGlassFrame(ctx, getGlassRect, render, getFrameShake(state));
  drawBackground(ctx, render, getGlassRect, state.engine.timing.timestamp);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, GLASS_WIDTH, GLASS_HEIGHT);
  ctx.clip();
  ctx.translate(left, 0);
  const laserState = getLaserState(state, killY, 150, getGlassRect);
  const danger = laserState.danger;
  drawLaserBarrier(
    ctx,
    killY,
    GLASS_WIDTH,
    state.engine.timing.timestamp / 1000,
    danger,
    undefined,
    laserState.timerProgress,
    laserState.touchMs,
    laserState.alpha
  );
  ctx.restore();
  ctx.restore();
  // Control line rendering intentionally hidden; logic remains.

  if (DEBUG_OVERLAY) {
    // Reserved for future debug visuals.
  }

  drawWaitFill(state, ctx);
  drawAimGuides(state, ctx, getGlassRect);
  drawCustomOutlines(state, ctx);
  drawBonusButtons(state, ctx, getGlassRect);
  drawBubbles(state, ctx);
  drawBubblePopParticles(state, ctx);
  drawBubblePopIcons(state, ctx);
  drawGunMarks(state, ctx);
  drawBubbleKeyHint(state, ctx);
  drawLevelUpPopups(state, ctx);
  drawCanvasUiWorld({ ctx, state, render, getGlassRect });
  Render.endViewTransform(render);
  drawRewardFloaters(state, ctx);
  drawScoreParticles(state, ctx);
  drawComboPopups(state, ctx);
  drawCanvasUiScreen({ ctx, state, render, getGlassRect });
  drawGameOverBanner(ctx, state, render, getGlassRect, killY);
  ctx.restore();
}

function getLaserState(state, deathLineY, thresholdPx, getGlassRect) {
  let highestY = Infinity;
  const bodies = Matter.Composite.allBodies(state.world);
  for (const body of bodies) {
    if (body.isStatic || body.parent !== body) {
      continue;
    }
    if (body === state.waitingBody) {
      continue;
    }
    if (body.plugin?.impactArmed) {
      continue;
    }
    if (body.plugin?.isGlass || body.plugin?.burst?.active) {
      continue;
    }
    highestY = Math.min(highestY, body.bounds.min.y);
  }
  const touchMs = state.killTouchMs || 0;
  const timerProgress =
    KILL_DURATION_MS > 0 ? Math.max(0, Math.min(1, touchMs / KILL_DURATION_MS)) : 0;
  const glass = getGlassRect ? getGlassRect() : { top: 0 };
  const floorY = glass.top + GLASS_HEIGHT;
  const hasStack = Number.isFinite(highestY);
  const fillRatio = hasStack
    ? Math.max(0, Math.min(1, (floorY - highestY) / GLASS_HEIGHT))
    : 0;
  let alpha = lerp(0.2, 0.8, fillRatio);
  const lastSecondsStart = Math.max(0, KILL_DURATION_MS - 5000);
  if (touchMs >= lastSecondsStart && KILL_DURATION_MS > 0) {
    alpha = 1;
  }
  if (!hasStack) {
    return { danger: 0, timerProgress, touchMs, alpha };
  }
  const distance = deathLineY - highestY;
  const raw = 1 - distance / thresholdPx;
  const stackDanger = Math.max(0, Math.min(1, raw));
  let danger = stackDanger * 0.5;
  if (touchMs > 0) {
    danger = 0.5 + 0.5 * timerProgress;
  }
  return { danger, timerProgress, touchMs, alpha };
}

function getFrameShake(state) {
  const touchMs = state.killTouchMs || 0;
  if (touchMs <= 0 || KILL_DURATION_MS <= 0) {
    return { x: 0, y: 0 };
  }
  const lastSecondsStart = Math.max(0, KILL_DURATION_MS - 5000);
  if (touchMs < lastSecondsStart) {
    return { x: 0, y: 0 };
  }
  const timeSec = state.engine.timing.timestamp / 1000;
  const t = Math.max(
    0,
    Math.min(1, (touchMs - lastSecondsStart) / Math.max(1, KILL_DURATION_MS - lastSecondsStart))
  );
  const amplitude = lerp(0.4, 2.0, t);
  const jitter = lerp(0.2, 1.2, t);
  const frequency = lerp(2.0, 7.0, t);
  const x =
    Math.sin(timeSec * frequency) * amplitude + (Math.random() - 0.5) * jitter;
  const y =
    Math.cos(timeSec * frequency * 0.9) * amplitude +
    (Math.random() - 0.5) * jitter;
  return { x, y };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
