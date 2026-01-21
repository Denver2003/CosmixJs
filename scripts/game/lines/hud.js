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
import { formatNumber } from "../../ui/format.js";
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

  const scoreText = formatNumber(Math.floor(state.score || 0));
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

  const coinsText = formatNumber(Math.floor(state.coins || 0));
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

export function isPauseButtonHover(state, render, getGlassRect, x, y) {
  const { pause } = getTopHudLayout(state, render, getGlassRect);
  if (!pause) {
    return false;
  }
  const dx = x - pause.centerX;
  const dy = y - pause.centerY;
  return dx * dx + dy * dy <= pause.radius * pause.radius;
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

  const energy = Math.max(0, Math.min(COSMO_ENERGY_MAX, state.energy || 0));
  const fillRatio = COSMO_ENERGY_MAX ? energy / COSMO_ENERGY_MAX : 0;
  const fillHeight = Math.max(0, Math.min(1, fillRatio)) * height;
  const fillY = y + height - fillHeight;
  const level = getEnergyLevel(energy);
  const timeSec = (state.engine?.timing?.timestamp || 0) / 1000;
  const pulse = 0.5 + 0.5 * Math.sin(timeSec * (1.6 + level * 0.4));
  const color = getCosmoLevelColor(level);
  const rgb = hexToRgb(color);

  ctx.save();
  ctx.fillStyle = "rgba(6, 8, 12, 0.7)";
  ctx.beginPath();
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (fillHeight > 0) {
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, x, y, width, height, radius);
    ctx.clip();

    const coreGradient = ctx.createLinearGradient(0, fillY, 0, y + height);
    coreGradient.addColorStop(
      0,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lerp(0.7, 1, pulse).toFixed(3)})`
    );
    coreGradient.addColorStop(
      1,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lerp(0.35, 0.55, pulse).toFixed(3)})`
    );
    ctx.fillStyle = coreGradient;
    ctx.fillRect(x, fillY, width, fillHeight);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lerp(0.4, 0.75, pulse).toFixed(3)})`;
    ctx.shadowBlur = 8 + level * 3;
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lerp(0.2, 0.45, pulse).toFixed(3)})`;
    ctx.fillRect(x, fillY, width, fillHeight);
    ctx.restore();

    if (level >= 2) {
      const scanCount = level >= 5 ? 4 : 3;
      const scanSpeed = 28 + level * 8;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lerp(0.2, 0.5, pulse).toFixed(3)})`;
      for (let i = 0; i < scanCount; i += 1) {
        const offset = (timeSec * scanSpeed + i * 18) % (fillHeight + 24);
        const lineY = fillY + fillHeight - offset;
        ctx.fillRect(x, lineY, width, 2);
      }
      ctx.restore();
    }

    if (level >= 3) {
      const sparkCount = level >= 5 ? 4 : 2;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < sparkCount; i += 1) {
        const sx = x + Math.random() * width;
        const sy = fillY + Math.random() * fillHeight;
        const radiusPx = 0.8 + Math.random() * 1.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.4 + 0.3 * pulse).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, radiusPx, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    const capHeight = Math.min(10, Math.max(4, width * 1.4));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const capGradient = ctx.createLinearGradient(0, fillY, 0, fillY + capHeight);
    capGradient.addColorStop(
      0,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lerp(0.6, 0.9, pulse).toFixed(3)})`
    );
    capGradient.addColorStop(
      1,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`
    );
    ctx.fillStyle = capGradient;
    ctx.fillRect(x, fillY, width, capHeight);
    ctx.restore();
    ctx.restore();
  }

  if (fillHeight > 0) {
    const glowPad = 4 + level * 1.5;
    const glowRadius = radius + glowPad;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lerp(0.25, 0.5, pulse).toFixed(3)})`;
    ctx.shadowBlur = 10 + level * 4;
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lerp(0.08, 0.18, pulse).toFixed(3)})`;
    ctx.beginPath();
    roundRectPath(
      ctx,
      x - glowPad,
      fillY - 2,
      width + glowPad * 2,
      fillHeight + 4,
      glowRadius
    );
    ctx.fill();
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
    `LVL ${formatNumber(state.level)}`,
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
    `${formatNumber(state.clearedThisLevel)}/${formatNumber(state.toNextLevel)}`,
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

function getCosmoLevelColor(level) {
  if (level >= 5) {
    return "#FF7A4A";
  }
  if (level >= 3) {
    return "#B07CFF";
  }
  if (level >= 2) {
    return "#7B9BFF";
  }
  return "#7AD9FF";
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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
    ctx.fillText(`${formatNumber(popup.multiplier)}x`, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
