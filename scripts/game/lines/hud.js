import {
  COSMO_ENERGY_L2,
  COSMO_ENERGY_L3,
  COSMO_ENERGY_L5,
  COSMO_ENERGY_MAX,
  GLASS_HEIGHT,
  GLASS_WIDTH,
  KILL_OFFSET,
  WALL_THICKNESS,
} from "../../config.js";
import { getTopHudLayout } from "../../ui/hud.js";
import { getGlassBorderRects, getGlassFrame } from "../../ui/layout.js";
import { getCosmoBaseColor } from "../cosmometer.js";
import { drawBubbleIcon } from "../bubbles.js";
import { drawPauseButton } from "../pause_button.js";
import { getLevelColor } from "../level_up_popup.js";
import { hexToRgba } from "../utils.js";
import { roundRectPath } from "./utils.js";

export function drawTopHud(state, ctx, render, getGlassRect) {
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

export function drawCosmometer(state, ctx, getGlassRect) {
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
  const radius = width / 2;

  ctx.save();
  ctx.fillStyle = hexToRgba("#000000", 0.2);
  ctx.beginPath();
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.fill();

  const energy = Math.max(0, Math.min(COSMO_ENERGY_MAX, state.energy || 0));
  const fillRatio = COSMO_ENERGY_MAX ? energy / COSMO_ENERGY_MAX : 0;
  const fillHeight = Math.max(0, Math.min(1, fillRatio)) * height;
  const fillY = y + height - fillHeight;

  const baseLevel = getEnergyLevel(energy);
  const fillColor = getCosmoBaseColor(baseLevel);
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

export function drawBottomProgress(state, ctx, getGlassRect) {
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
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = hexToRgba(popup.color || "#ffffff", alpha);
    ctx.fillText(`${popup.multiplier}x`, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
