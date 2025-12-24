import {
  DEBUG_OVERLAY,
  GLASS_WIDTH,
  KILL_OFFSET,
  SPAWN_OFFSET,
} from "../config.js";
import { hexToRgba } from "./utils.js";
import { getSpawnWaitMs } from "./state.js";

const { Composite, Render } = Matter;

export function drawLines(state, render, getGlassRect) {
  const { left, top } = getGlassRect();
  const spawnY = top + SPAWN_OFFSET;
  const killY = top + KILL_OFFSET;

  const ctx = render.context;
  ctx.save();
  Render.startViewTransform(render);
  // Control line rendering intentionally hidden; logic remains.

  const killPhaseMs = state.killTouchMs;
  let alpha = 0.25;
  if (killPhaseMs >= 2000 && killPhaseMs < 6000) {
    const phase = state.engine.timing.timestamp / 1000;
    alpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
  } else if (killPhaseMs >= 6000) {
    const phase = state.engine.timing.timestamp / 250;
    alpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
  }
  ctx.strokeStyle = hexToRgba("#f55a5a", alpha);
  ctx.beginPath();
  ctx.moveTo(left, killY);
  ctx.lineTo(left + GLASS_WIDTH, killY);
  ctx.stroke();

  if (state.gameOver) {
    ctx.fillStyle = "#f55a5a";
    ctx.font = "20px sans-serif";
    ctx.fillText("GAME OVER", left + 10, top + 30);
  }

  if (DEBUG_OVERLAY) {
    const right = left + GLASS_WIDTH;
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`LVL ${state.level}`, right - 6, top + 14);
    ctx.fillText(
      `CLEARED ${state.clearedThisLevel}/${state.toNextLevel}`,
      right - 6,
      top + 28
    );
    const angleDeg = Math.round((state.rotationRange * 180) / Math.PI);
    ctx.fillText(`ANGLE ${angleDeg}°`, right - 6, top + 42);
    ctx.fillText(`COLORS ${state.colorsCount}`, right - 6, top + 56);
    ctx.textAlign = "start";
  }

  drawWaitFill(state, ctx);
  drawCustomOutlines(state, ctx);
  drawPauseOverlay(state, ctx, render);
  Render.endViewTransform(render);
  ctx.restore();
}

function drawCustomOutlines(state, ctx) {
  const bodies = Composite.allBodies(state.world);
  ctx.save();
  ctx.lineWidth = 2;
  for (const body of bodies) {
    const outlineEdges = body.plugin?.outlineEdges;
    const cellRects = body.plugin?.cellRects;
    const color = body.plugin?.color;
    if (!outlineEdges || !color) {
      continue;
    }
    const scale = body.plugin?.scaleCurrent || 1;
    const alpha = body.plugin?.preview ? body.plugin?.previewAlpha ?? 0.4 : null;
    const stroke = alpha === null ? color : hexToRgba(color, alpha);
    const fillAlpha = body.plugin?.fillAlpha ?? 0;
    const fill =
      fillAlpha > 0 ? hexToRgba(color, Math.min(fillAlpha, 1)) : null;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.scale(scale, scale);

    if (fill && cellRects) {
      ctx.fillStyle = fill;
      for (const rect of cellRects) {
        ctx.fillRect(rect.x, rect.y, rect.size, rect.size);
      }
    }

    ctx.beginPath();
    for (const edge of outlineEdges) {
      ctx.moveTo(edge.x1, edge.y1);
      ctx.lineTo(edge.x2, edge.y2);
    }
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawWaitFill(state, ctx) {
  const body = state.waitingBody;
  if (!body || state.waitingState !== "armed") {
    return;
  }
  const elapsedMs = state.engine.timing.timestamp - state.waitStartMs;
  const waitMs = getSpawnWaitMs(state.level);
  const progress = Math.max(0, Math.min(1, elapsedMs / waitMs));
  const bounds = body.bounds;
  const height = bounds.max.y - bounds.min.y;
  const fillHeight = height * progress;
  const color = body.plugin?.color || "#ffffff";
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
  for (let i = 1; i < body.vertices.length; i += 1) {
    ctx.lineTo(body.vertices[i].x, body.vertices[i].y);
  }
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = hexToRgba(color, 0.25);
  ctx.fillRect(
    bounds.min.x,
    bounds.min.y,
    bounds.max.x - bounds.min.x,
    fillHeight
  );
  ctx.restore();
}

function drawPauseOverlay(state, ctx, render) {
  if (!state.paused) {
    return;
  }
  const viewWidth =
    state.viewWidth || render.options.width / Math.max(1, state.viewScale || 1);
  const viewHeight =
    state.viewHeight ||
    render.options.height / Math.max(1, state.viewScale || 1);
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;
  const boxWidth = Math.min(320, viewWidth * 0.7);
  const boxHeight = 70;
  const nowMs =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  const phase = nowMs / 250;
  const alpha = 0.2 + 0.2 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));

  ctx.save();
  ctx.fillStyle = hexToRgba("#0f1115", 0.55 + alpha * 0.2);
  ctx.fillRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);
  ctx.strokeStyle = hexToRgba("#cfd8dc", 0.9);
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  const isAuto = state.pausedReason && state.pausedReason !== "manual";
  const label = isAuto ? "PAUSED (AUTO)" : "PAUSED";
  ctx.fillText(label, centerX, centerY - 6);
  if (isAuto && state.pausedResumeMs) {
    const nowMs =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    const remaining = Math.max(0, state.pausedResumeMs - nowMs);
    const seconds = Math.ceil(remaining / 1000);
    ctx.font = "12px sans-serif";
    ctx.fillText(`RESUMING IN ${seconds}`, centerX, centerY + 12);
  } else {
    ctx.font = "12px sans-serif";
    ctx.fillText("PRESS P TO RESUME", centerX, centerY + 12);
  }
  ctx.restore();
}
