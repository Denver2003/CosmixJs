import {
  BACKGROUND_STAR_ALPHA_MAX,
  BACKGROUND_STAR_ALPHA_MIN,
  BACKGROUND_STAR_COUNT,
  BACKGROUND_STAR_MAX_RADIUS,
  BACKGROUND_STAR_MIN_RADIUS,
  BACKGROUND_STAR_SPEED_MAX,
  BACKGROUND_STAR_SPEED_MIN,
  BACKGROUND_STAR_SPEED_X_MAX,
  BACKGROUND_STAR_SPEED_X_MIN,
  BACKGROUND_STAR_TWINKLE_CHANCE,
  BACKGROUND_STAR_TWINKLE_MAX,
  BACKGROUND_STAR_TWINKLE_MIN,
  BACKGROUND_STAR_TWINKLE_SPEED_MAX,
  BACKGROUND_STAR_TWINKLE_SPEED_MIN,
  GLASS_HEIGHT,
  GLASS_WIDTH,
  WALL_THICKNESS,
} from "../config.js";

const BACKGROUND_SRC = "./assets/backgrounds/space_bg_placeholder.png";
let backgroundImage = null;
let starField = null;

function getBackgroundImage() {
  if (backgroundImage) {
    return backgroundImage;
  }
  const image = new Image();
  image.onerror = () => {
    image._broken = true;
  };
  image.src = BACKGROUND_SRC;
  backgroundImage = image;
  return backgroundImage;
}

function ensureStarField() {
  if (starField) {
    return starField;
  }
  starField = Array.from({ length: BACKGROUND_STAR_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: randRange(BACKGROUND_STAR_MIN_RADIUS, BACKGROUND_STAR_MAX_RADIUS),
    baseAlpha: randRange(BACKGROUND_STAR_ALPHA_MIN, BACKGROUND_STAR_ALPHA_MAX),
    twinkleEnabled: Math.random() < BACKGROUND_STAR_TWINKLE_CHANCE,
    twinkleAmp: randRange(BACKGROUND_STAR_TWINKLE_MIN, BACKGROUND_STAR_TWINKLE_MAX),
    twinkleSpeed: randRange(
      BACKGROUND_STAR_TWINKLE_SPEED_MIN,
      BACKGROUND_STAR_TWINKLE_SPEED_MAX
    ),
    drift: randRange(BACKGROUND_STAR_SPEED_MIN, BACKGROUND_STAR_SPEED_MAX),
    driftX: randRange(BACKGROUND_STAR_SPEED_X_MIN, BACKGROUND_STAR_SPEED_X_MAX),
    phase: Math.random() * Math.PI * 2,
  }));
  return starField;
}

export function updateBackgroundStars(deltaMs) {
  const stars = ensureStarField();
  const dt = Math.max(0, deltaMs) / 1000;
  for (const star of stars) {
    star.y += star.drift * dt;
    star.x += star.driftX * dt;
    if (star.y > 1.05) {
      star.y = -0.05;
      star.x = Math.random();
    }
    if (star.x > 1.05) {
      star.x = -0.05;
    }
  }
}

export function drawBackground(ctx, render, getGlassRect, nowMs) {
  const image = getBackgroundImage();
  const glass = getGlassRect();
  const targetTop = render.bounds.min.y;
  const targetHeight = render.bounds.max.y - render.bounds.min.y;
  ctx.save();
  const hasImage =
    !image._broken && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
  const sourceWidth = hasImage ? image.naturalWidth : GLASS_WIDTH;
  const sourceHeight = hasImage ? image.naturalHeight : targetHeight;
  const scale = targetHeight / sourceHeight;
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const centerX = glass.left + GLASS_WIDTH / 2;
  const centerY = glass.top + GLASS_HEIGHT / 2;
  const x = centerX - drawWidth / 2;
  const y = centerY - drawHeight / 2;
  if (hasImage) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, drawWidth, drawHeight);
    ctx.clip();
    drawStars(ctx, x, y, drawWidth, drawHeight, nowMs, scale);
    ctx.restore();
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
  }
  ctx.restore();
}

function drawStars(ctx, x, y, width, height, nowMs, scale) {
  const stars = ensureStarField();
  const time = (nowMs ?? 0) / 1000;
  for (const star of stars) {
    const twinkle = star.twinkleEnabled
      ? star.baseAlpha +
        Math.sin(time * star.twinkleSpeed + star.phase) * star.twinkleAmp
      : star.baseAlpha;
    const alpha = Math.max(0.05, Math.min(1, twinkle));
    ctx.fillStyle = `rgba(230, 240, 255, ${alpha.toFixed(3)})`;
    const radius = star.radius * scale;
    const sx = x + star.x * width;
    const sy = y + star.y * height;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}
