import {
  COSMO_ENERGY_L2,
  COSMO_ENERGY_L3,
  COSMO_ENERGY_L5,
  COSMO_ENERGY_MAX,
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
import { drawComboPopups, updateComboPopups } from "./combo_popup.js";
import { getCosmoBaseColor } from "./cosmometer.js";
import {
  drawBubbles,
  drawBubbleIcon,
  drawBubblePopIcons,
  drawBubblePopParticles,
  updateBubbles,
  updateBubblePopIcons,
  updateBubblePopParticles,
} from "./bubbles.js";
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
  updateBubbles(state, state.engine.timing.lastDelta, getGlassRect);
  updateBubblePopParticles(state, state.engine.timing.lastDelta);
  updateBubblePopIcons(state);
  drawBubbles(state, ctx);
  drawBubblePopParticles(state, ctx);
  drawBubblePopIcons(state, ctx);
  drawBubbleIconLegend(state, ctx, getGlassRect);
  drawGlassCaps(ctx, getGlassRect);
  Render.endViewTransform(render);
  updateScoreParticles(state, render, getGlassRect);
  drawScoreParticles(state, ctx);
  updateComboPopups(state);
  drawComboPopups(state, ctx);
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

  const energy = Math.max(0, Math.min(COSMO_ENERGY_MAX, state.energy || 0));
  const fillRatio = COSMO_ENERGY_MAX ? energy / COSMO_ENERGY_MAX : 0;
  const fillHeight = Math.max(0, Math.min(1, fillRatio)) * height;
  const fillY = y + height - fillHeight;

  const now = state.engine.timing.timestamp;
  const baseLevel = getEnergyLevel(energy);
  let fillColor = getCosmoBaseColor(baseLevel);
  if (state.cosmoColorBlendStartMs) {
    const blendMs = 500;
    const t = Math.max(0, Math.min(1, (now - state.cosmoColorBlendStartMs) / blendMs));
    if (t < 1 && state.cosmoColorFrom && state.cosmoColorTo) {
      fillColor = blendHex(state.cosmoColorFrom, state.cosmoColorTo, t);
    }
  }
  if (fillHeight > 0) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, fillY, width, fillHeight);
  }

  const markerDiameter = (WALL_THICKNESS * 2) / 3;
  const markerX = x + width / 2;
  const markerDefs = [
    { threshold: 0, y: y + height, scale: 1 },
    {
      threshold: COSMO_ENERGY_L2,
      y: y + height - height * (COSMO_ENERGY_L2 / COSMO_ENERGY_MAX),
      scale: 1.1,
    },
    {
      threshold: COSMO_ENERGY_L3,
      y: y + height - height * (COSMO_ENERGY_L3 / COSMO_ENERGY_MAX),
      scale: 1.2,
    },
    {
      threshold: COSMO_ENERGY_L5,
      y: y + height - height * (COSMO_ENERGY_L5 / COSMO_ENERGY_MAX),
      scale: 1.3,
    },
  ];
  ctx.fillStyle = fillColor;
  for (const marker of markerDefs) {
    if (energy < marker.threshold) {
      continue;
    }
    const radius = (markerDiameter / 2) * (marker.scale || 1);
    ctx.beginPath();
    ctx.arc(markerX, marker.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  updateCosmoPopups(state);
  drawCosmoPopups(state, ctx, { x, y, width, height });
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

function drawBubbleIconLegend(state, ctx, getGlassRect) {
  const glassRect = getGlassRect();
  const x = glassRect.left - WALL_THICKNESS * 2.2;
  const startY = glassRect.top + WALL_THICKNESS * 2.2;
  const spacing = 44;
  const size = 44;
  const sampleColors = ["#00e5ff", "#00ff85", "#ffe600"];
  const items = [
    { type: "coins", amount: 1 },
    { type: "points", subtype: "points1", amount: 1 },
    { type: "points", subtype: "points2", amount: 1 },
    { type: "points", subtype: "points3", amount: 1 },
    { type: "instant", subtype: "hail", colors: sampleColors },
    { type: "instant", subtype: "grenade", color: "#ff5bd8" },
    { type: "consumable", subtype: "touch" },
    { type: "consumable", subtype: "machine" },
  ];
  ctx.save();
  for (let i = 0; i < items.length; i += 1) {
    const y = startY + i * spacing;
    drawBubbleIcon(ctx, x, y, size, items[i]);
  }
  ctx.restore();
}

function getEnergyLevel(energy) {
  if (energy >= COSMO_ENERGY_L5) {
    return 5;
  }
  if (energy >= COSMO_ENERGY_L3) {
    return 3;
  }
  if (energy >= COSMO_ENERGY_L2) {
    return 2;
  }
  return 1;
}

function blendHex(fromHex, toHex, t) {
  const from = parseHex(fromHex);
  const to = parseHex(toHex);
  if (!from || !to) {
    return fromHex || toHex || "#ffffff";
  }
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function parseHex(hex) {
  if (!hex || !hex.startsWith("#")) {
    return null;
  }
  const value = hex.slice(1);
  const expanded =
    value.length === 3
      ? value
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : value;
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return null;
  }
  return { r, g, b };
}

function updateCosmoPopups(state) {
  const popups = state.cosmoPopups;
  if (!popups || popups.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const next = [];
  for (const popup of popups) {
    const elapsed = now - popup.startMs;
    if (elapsed <= 2300) {
      next.push(popup);
    }
  }
  state.cosmoPopups = next;
}

function drawCosmoPopups(state, ctx, bar) {
  const popups = state.cosmoPopups;
  if (!popups || popups.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const phase1 = 300;
  const phase2 = 2000;
  const moveX = bar.width * 2 + 12;
  const lift = bar.height * 0.1;
  ctx.save();
  ctx.font = "16px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const popup of popups) {
    const elapsed = now - popup.startMs;
    if (elapsed < 0) {
      continue;
    }
    const ratio =
      COSMO_ENERGY_MAX > 0 ? popup.threshold / COSMO_ENERGY_MAX : 0;
    const startX = bar.x + bar.width / 2;
    const startY = bar.y + bar.height - bar.height * ratio;
    let x = startX;
    let y = startY;
    let scale = 1;
    let alpha = 1;
    if (elapsed <= phase1) {
      const t = Math.max(0, Math.min(1, elapsed / phase1));
      const ease = 1 - Math.pow(1 - t, 3);
      x = startX + moveX * ease;
      y = startY;
      scale = 1 + (2 - 1) * ease;
      alpha = 1;
    } else {
      const t = Math.max(0, Math.min(1, (elapsed - phase1) / phase2));
      const ease = 1 - Math.pow(1 - t, 2);
      x = startX + moveX;
      y = startY - lift * ease;
      scale = 2;
      alpha = Math.max(0, 1 - t);
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = hexToRgba(popup.color || "#ffffff", alpha);
    ctx.fillText(`${popup.multiplier}x`, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
