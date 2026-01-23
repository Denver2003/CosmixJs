import { GLASS_WIDTH } from "../config.js";
import { t } from "../ui/i18n.js";

export function drawGameOverBanner(ctx, state, render, getGlassRect, killY) {
  if (!state.gameOver) {
    state.gameOverBannerStartMs = 0;
    return;
  }
  if (state.mode !== "gameover") {
    state.gameOverBannerStartMs = 0;
    return;
  }
  if (typeof window !== "undefined") {
    const router = window.__shellRouter;
    if (router && router.activeScreen && router.activeScreen !== "game") {
      state.gameOverBannerStartMs = 0;
      return;
    }
  }
  if (!render || !getGlassRect) {
    return;
  }
  const now = getNowMs();
  if (!state.gameOverBannerStartMs) {
    state.gameOverBannerStartMs = now;
  }

  const elapsed = Math.max(0, now - state.gameOverBannerStartMs);
  const appearT = clamp01(elapsed / 200);
  const ease = 1 - Math.pow(1 - appearT, 3);
  const scale = lerp(0.6, 1, ease);
  const alpha = ease;

  const glass = getGlassRect();
  const bounds = render.bounds;
  const widthPx = render.options.width;
  const heightPx = render.options.height;
  const scaleX = widthPx / (bounds.max.x - bounds.min.x);
  const scaleY = heightPx / (bounds.max.y - bounds.min.y);
  const centerX = (glass.left + GLASS_WIDTH / 2 - bounds.min.x) * scaleX;
  const baseY = (killY - bounds.min.y) * scaleY;
  const glassWidthScreen = GLASS_WIDTH * scaleX;
  const width = clamp(240, glassWidthScreen * 0.9, 360);
  const height = clamp(64, width * 0.32, 96);
  const centerY = baseY - height * 0.6;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  drawBanner(ctx, width, height, now / 1000);
  ctx.restore();
}

function drawBanner(ctx, width, height, timeSec) {
  const halfW = width / 2;
  const halfH = height / 2;
  const radius = Math.min(18, height * 0.28);
  ctx.save();
  ctx.translate(-halfW, -halfH);
  ctx.fillStyle = "rgba(10, 12, 16, 0.9)";
  roundedRect(ctx, 0, 0, width, height, radius);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const fontSize = Math.round(height * 0.46);
  const text = t("game_over.title");
  ctx.font = `${fontSize}px "RussoOne", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const base = { r: 120, g: 220, b: 255 };
  const tint = mixColor(base, { r: 160, g: 120, b: 255 }, 0.5);
  const pulse = 0.5 + 0.5 * Math.sin(timeSec * 6);
  const danger = mixColor(tint, { r: 255, g: 80, b: 80 }, pulse * 0.8);
  const textGradient = ctx.createLinearGradient(0, 0, width, 0);
  textGradient.addColorStop(
    0,
    `rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.9)`
  );
  textGradient.addColorStop(
    0.5,
    `rgba(${danger.r}, ${danger.g}, ${danger.b}, 1)`
  );
  textGradient.addColorStop(
    1,
    `rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.9)`
  );
  ctx.save();
  ctx.shadowColor = `rgba(${danger.r}, ${danger.g}, ${danger.b}, 0.8)`;
  ctx.shadowBlur = 18;
  ctx.fillStyle = textGradient;
  ctx.fillText(text, halfW, halfH);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = `rgba(${danger.r}, ${danger.g}, ${danger.b}, 0.35)`;
  const scanCount = 3;
  for (let i = 0; i < scanCount; i += 1) {
    const offset = (timeSec * 60 + i * 40) % (height + 20);
    ctx.fillRect(0, offset - 10, width, 3);
  }
  ctx.restore();

  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value) {
  return clamp(0, value, 1);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixColor(from, to, t) {
  return {
    r: Math.round(from.r + (to.r - from.r) * t),
    g: Math.round(from.g + (to.g - from.g) * t),
    b: Math.round(from.b + (to.b - from.b) * t),
  };
}

function getNowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}
