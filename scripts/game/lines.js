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
import { drawScoreParticles } from "./score_particles.js";
import { drawComboPopups } from "./combo_popup.js";
import { getCosmoBaseColor } from "./cosmometer.js";
import {
  drawBubbles,
  drawBubbleIcon,
  drawBubblePopIcons,
  drawBubblePopParticles,
} from "./bubbles.js";
import { drawGunMarks } from "./bonuses.js";
import { hexToRgba } from "./utils.js";
import { getSpawnWaitMs } from "./state.js";
import { drawRewardFloaters } from "./reward_floaters.js";
import { drawBackground } from "./background.js";
import { drawGlassFrame } from "./glass_frame.js";
import {
  drawBonusButtons,
  drawBubbleIconLegend,
  drawBubbleKeyHint,
} from "./draw/bonus_ui.js";
import { drawTouchOverlay } from "./draw/overlays.js";
import { drawLevelUpPopups, getLevelColor } from "./level_up_popup.js";
import { drawPauseButton } from "./pause_button.js";

const { Composite, Render } = Matter;

export function drawLines(state, render, getGlassRect) {
  const { left, top } = getGlassRect();
  const spawnY = top + SPAWN_OFFSET;
  const killY = top + KILL_OFFSET;

  const ctx = render.context;
  ctx.save();
  Render.startViewTransform(render);
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  drawGlassFrame(ctx, getGlassRect, render);
  drawBackground(ctx, render, getGlassRect, state.engine.timing.timestamp);
  ctx.restore();
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
  drawTouchOverlay(state, ctx, getGlassRect, spawnY);
  drawBottomProgress(state, ctx, getGlassRect);
  drawBubbles(state, ctx);
  drawBubblePopParticles(state, ctx);
  drawBubblePopIcons(state, ctx);
  drawGunMarks(state, ctx);
  drawBubbleKeyHint(state, ctx);
  drawLevelUpPopups(state, ctx);
  Render.endViewTransform(render);
  drawRewardFloaters(state, ctx);
  drawScoreParticles(state, ctx);
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
  const { leftX, valueY, coinsGap, pause } = getTopHudLayout(
    state,
    render,
    getGlassRect
  );

  const textScale = state.viewScale || 1;
  const iconSize = 18 * textScale;
  const iconGap = 6 * textScale;
  const hudY = pause.y + iconSize / 2 + 2 * textScale + 7 * textScale;

  ctx.save();
  ctx.textBaseline = "middle";

  const scoreText = Math.floor(state.score || 0).toString().padStart(5, "0");
  drawBubbleIcon(ctx, leftX + iconSize / 2, hudY, iconSize, {
    type: "points",
    subtype: "points1",
    amount: 1,
  });
  ctx.fillStyle = "#e0e4e8";
  ctx.font = `${Math.round(18 * textScale)}px "RussoOne", sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(scoreText, leftX + iconSize + iconGap, hudY);

  drawPauseButton(ctx, pause);

  const coinsText = Math.floor(state.coins || 0).toString().padStart(3, "0");
  ctx.font = `${Math.round(16 * textScale)}px "RussoOne", sans-serif`;
  const coinsWidth = ctx.measureText(coinsText).width;
  const coinsGroupRight = pause.x - coinsGap;
  const coinsGroupLeft = coinsGroupRight - (iconSize + iconGap + coinsWidth);
  drawBubbleIcon(ctx, coinsGroupLeft + iconSize / 2, hudY, iconSize, {
    type: "coins",
    amount: 1,
  });
  ctx.fillStyle = "#f0c74a";
  ctx.textAlign = "left";
  ctx.fillText(coinsText, coinsGroupLeft + iconSize + iconGap, hudY);

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
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "14px \"RussoOne\", sans-serif";
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
    ctx.font = "12px \"RussoOne\", sans-serif";
    ctx.fillText(`RESUMING IN ${seconds}`, centerX, centerY + 12);
  } else {
    ctx.font = "12px \"RussoOne\", sans-serif";
    ctx.fillText("PRESS P TO RESUME", centerX, centerY + 12);
  }
  ctx.restore();
}

function drawCosmometer(state, ctx, getGlassRect) {
  const glassRect = getGlassRect();
  const glassFrame = getGlassFrame(glassRect);
  const { leftBorderRect } = getGlassBorderRects(glassFrame);
  const width = WALL_THICKNESS / 3;
  const x = leftBorderRect.x + (leftBorderRect.width - width) / 2 - 15;
  const bottomY = glassRect.top + GLASS_HEIGHT - WALL_THICKNESS;
  const topY = glassRect.top + KILL_OFFSET - WALL_THICKNESS;
  const yTop = Math.min(topY, bottomY);
  const yBottom = Math.max(topY, bottomY);
  const height = Math.max(0, yBottom - yTop);
  const y = yTop;

  ctx.save();
  const radius = width / 2;
  ctx.fillStyle = hexToRgba("#000000", 0.2);
  ctx.beginPath();
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.fill();

  const energy = Math.max(0, Math.min(COSMO_ENERGY_MAX, state.energy || 0));
  const fillRatio = COSMO_ENERGY_MAX ? energy / COSMO_ENERGY_MAX : 0;
  const fillHeight = Math.max(0, Math.min(1, fillRatio)) * height;
  const fillY = y + height - fillHeight;

  const now = state.engine.timing.timestamp;
  const baseLevel = getEnergyLevel(energy);
  let fillColor = getCosmoBaseColor(baseLevel);
  if (state.cosmoColorBlendStartMs) {
    state.cosmoColorBlendStartMs = 0;
    state.cosmoColorFrom = null;
    state.cosmoColorTo = null;
  }
  if (fillHeight > 0) {
    ctx.fillStyle = hexToRgba(fillColor, 0.8);
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.fillRect(x, fillY, width, fillHeight);
    ctx.restore();
  }

  ctx.restore();

  updateCosmoPopups(state);
  drawCosmoPopups(state, ctx, { x, y, width, height });
}

function drawBottomProgress(state, ctx, getGlassRect) {
  const glassRect = getGlassRect();
  const glassFrame = getGlassFrame(glassRect);
  const { bottomBorderRect } = getGlassBorderRects(glassFrame);
  const padding = 8;
  const barHeight = 10;
  const barWidth = GLASS_WIDTH * 0.5;
  const barX = glassRect.left + (GLASS_WIDTH - barWidth) / 2;
  const barY =
    bottomBorderRect.y + (bottomBorderRect.height - barHeight) / 2 + 23;
  const radius = barHeight / 2;
  const levelColor = getLevelColor(state.level);

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "15px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `LVL ${state.level}`,
    glassRect.left + GLASS_WIDTH / 2,
    barY - 32
  );

  ctx.strokeStyle = hexToRgba("#ffffff", 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  roundRectPath(ctx, barX, barY, barWidth, barHeight, radius);
  ctx.fillStyle = hexToRgba("#0f1115", 0.4);
  ctx.fill();
  ctx.stroke();
  const progress =
    state.toNextLevel > 0 ? state.clearedThisLevel / state.toNextLevel : 0;
  const fillWidth = Math.max(0, Math.min(1, progress)) * barWidth;
  ctx.fillStyle = hexToRgba(levelColor, 0.8);
  if (fillWidth > 0) {
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, barX, barY, barWidth, barHeight, radius);
    ctx.clip();
    ctx.fillRect(barX, barY, fillWidth, barHeight);
    ctx.restore();
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px \"RussoOne\", sans-serif";
  ctx.fillText(
    `${state.clearedThisLevel}/${state.toNextLevel}`,
    glassRect.left + GLASS_WIDTH - padding - 25,
    barY + barHeight - 2
  );
  ctx.restore();
}

function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
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
  ctx.font = "16px \"RussoOne\", sans-serif";
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
