import {
  DEBUG_OVERLAY,
  GLASS_HEIGHT,
  GLASS_WIDTH,
  KILL_OFFSET,
  SPAWN_OFFSET,
  WALL_THICKNESS,
} from "../config.js";
import { getTopHudLayout } from "../ui/hud.js";
import { getGlassBorderRects, getGlassFrame } from "../ui/layout.js";
import { drawScoreParticles, updateScoreParticles } from "./score_particles.js";
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
    // Reserved for future debug visuals.
  }

  drawWaitFill(state, ctx);
  drawCustomOutlines(state, ctx);
  drawCosmometer(state, ctx, getGlassRect);
  drawBonusButtons(state, ctx, getGlassRect);
  drawBottomProgress(state, ctx, getGlassRect);
  drawGlassCaps(ctx, getGlassRect);
  Render.endViewTransform(render);
  updateScoreParticles(state, render, getGlassRect);
  drawScoreParticles(state, ctx);
  drawTopHud(state, ctx, render, getGlassRect);
  drawPauseOverlay(state, ctx, render);
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

function drawTopHud(state, ctx, render, getGlassRect) {
  const { leftX, labelY, valueY, coinsGap, pause, rightX } = getTopHudLayout(
    state,
    render,
    getGlassRect
  );

  ctx.save();

  ctx.fillStyle = "#b8c0c6";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("SCORE", leftX, labelY);
  ctx.fillStyle = "#e0e4e8";
  ctx.font = "20px sans-serif";
  const scoreText = Math.floor(state.score || 0).toString().padStart(5, "0");
  ctx.fillText(scoreText, leftX, valueY);

  ctx.strokeStyle = "#cfd8dc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pause.centerX, pause.centerY, pause.radius, 0, Math.PI * 2);
  ctx.stroke();
  const barWidth = 4;
  const barHeight = 16;
  const barGap = 4;
  const barX = pause.centerX - (barWidth * 2 + barGap) / 2;
  const barY = pause.centerY - barHeight / 2;
  ctx.fillStyle = "#cfd8dc";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillRect(barX + barWidth + barGap, barY, barWidth, barHeight);

  ctx.textAlign = "right";
  ctx.fillStyle = "#d2b65a";
  ctx.font = "12px sans-serif";
  ctx.fillText("COINS", pause.x - coinsGap, labelY);
  ctx.fillStyle = "#f0c74a";
  ctx.font = "18px sans-serif";
  const coinsText = Math.floor(state.coins || 0).toString().padStart(3, "0");
  ctx.fillText(coinsText, pause.x - coinsGap, valueY);
  ctx.restore();
}

function drawPauseOverlay(state, ctx, render) {
  if (!state.paused) {
    return;
  }
  const viewWidth = render.options.width;
  const viewHeight = render.options.height;
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

function drawCosmometer(state, ctx, getGlassRect) {
  const glassRect = getGlassRect();
  const glassFrame = getGlassFrame(glassRect);
  const { leftBorderRect } = getGlassBorderRects(glassFrame);
  const width = WALL_THICKNESS / 3;
  const x = leftBorderRect.x + (leftBorderRect.width - width) / 2;
  const bottomY = glassRect.top + GLASS_HEIGHT - WALL_THICKNESS;
  const topY = glassRect.top + KILL_OFFSET - WALL_THICKNESS;
  const yTop = Math.min(topY, bottomY);
  const yBottom = Math.max(topY, bottomY);
  const height = Math.max(0, yBottom - yTop);
  const y = yTop;

  ctx.save();
  ctx.strokeStyle = "#cfd8dc";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#000000";
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  const markerDiameter = (WALL_THICKNESS * 2) / 3;
  const markerX = x + width / 2;
  const markerYs = [
    y,
    y + height / 3,
    y + (height * 2) / 3,
    y + height,
  ];
  ctx.fillStyle = "#000000";
  for (const markerY of markerYs) {
    const radius = markerDiameter / 2;
    ctx.beginPath();
    ctx.arc(markerX, markerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBonusButtons(state, ctx, getGlassRect) {
  const glassRect = getGlassRect();
  const glassFrame = getGlassFrame(glassRect);
  const { rightBorderRect } = getGlassBorderRects(glassFrame);
  const radius = WALL_THICKNESS;
  const centerX = rightBorderRect.x + rightBorderRect.width / 2;
  const startY = glassRect.top + KILL_OFFSET + WALL_THICKNESS * 2;
  const gap = WALL_THICKNESS * 2.5;
  const centers = [startY, startY + gap, startY + gap * 2];

  ctx.save();
  ctx.fillStyle = "#0f1115";
  ctx.strokeStyle = "#cfd8dc";
  ctx.lineWidth = 2;
  for (const centerY of centers) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawBottomProgress(state, ctx, getGlassRect) {
  const glassRect = getGlassRect();
  const glassFrame = getGlassFrame(glassRect);
  const { bottomBorderRect } = getGlassBorderRects(glassFrame);
  const padding = 8;
  const barHeight = 10;
  const barWidth = GLASS_WIDTH * 0.6;
  const barX = glassRect.left + (GLASS_WIDTH - barWidth) / 2;
  const barY = bottomBorderRect.y + (bottomBorderRect.height - barHeight) / 2;

  ctx.save();
  ctx.fillStyle = "#0f1115";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`LVL ${state.level}`, glassRect.left + padding, barY + barHeight - 2);

  ctx.strokeStyle = "#cfd8dc";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  const progress =
    state.toNextLevel > 0 ? state.clearedThisLevel / state.toNextLevel : 0;
  const fillWidth = Math.max(0, Math.min(1, progress)) * barWidth;
  ctx.fillStyle = "#cfd8dc";
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  const innerWidth = GLASS_WIDTH * 0.5;
  const innerHeight = WALL_THICKNESS * 0.5;
  const innerX = glassRect.left + (GLASS_WIDTH - innerWidth) / 2;
  const innerY = barY + (barHeight - innerHeight) / 2;
  ctx.fillStyle = "#0f1115";
  ctx.fillRect(innerX, innerY, innerWidth, innerHeight);

  const endRadius = innerHeight / 2;
  const endLeftX = innerX;
  const endRightX = innerX + innerWidth;
  const endY = innerY + innerHeight / 2;
  ctx.beginPath();
  ctx.arc(endLeftX, endY, endRadius, 0, Math.PI * 2);
  ctx.arc(endRightX, endY, endRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "right";
  ctx.fillStyle = "#0f1115";
  ctx.fillText(
    `${state.clearedThisLevel}/${state.toNextLevel}`,
    glassRect.left + GLASS_WIDTH - padding,
    barY + barHeight - 2
  );
  ctx.restore();
}

function drawGlassCaps(ctx, getGlassRect) {
  const glassRect = getGlassRect();
  const radius = WALL_THICKNESS / 2;
  const leftX = glassRect.left - radius;
  const rightX = glassRect.left + GLASS_WIDTH + radius;
  const y = glassRect.top - radius;

  ctx.save();
  ctx.fillStyle = "#cfd8dc";
  ctx.beginPath();
  ctx.arc(leftX, y, radius, 0, Math.PI * 2);
  ctx.arc(rightX, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
