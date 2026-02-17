import {
  BACKGROUND_STAR_ALPHA_MAX,
  BACKGROUND_STAR_ALPHA_MIN,
  BACKGROUND_STAR_COUNT,
  BACKGROUND_LEVEL_BRIGHTNESS_MAX_BOOST,
  BACKGROUND_LEVEL_BRIGHTNESS_STEP,
  BACKGROUND_LEVEL_SPEED_MAX_MULT,
  BACKGROUND_LEVEL_SPEED_STEP,
  BACKGROUND_STAR_MAX_RADIUS,
  BACKGROUND_STAR_MIN_RADIUS,
  BACKGROUND_ORBIT_MAX_RADIUS_PX,
  BACKGROUND_ORBIT_SPEED_RAD,
  BACKGROUND_ORBIT_TARGET_LEVEL,
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
let backgroundPromise = null;
let starField = null;
let visualLevel = 1;
const LEVEL_SMOOTHING_PER_SEC = 3.5;

function getBackgroundImage() {
  if (backgroundImage) {
    return backgroundImage;
  }
  const image = new Image();
  image.addEventListener(
    "error",
    () => {
      image._broken = true;
    },
    { once: true }
  );
  image.src = BACKGROUND_SRC;
  backgroundImage = image;
  return backgroundImage;
}

export function preloadBackground() {
  if (typeof Image === "undefined") {
    return Promise.resolve(null);
  }
  const image = getBackgroundImage();
  if (image._broken) {
    return Promise.resolve(null);
  }
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve(image);
  }
  if (backgroundPromise) {
    return backgroundPromise;
  }
  backgroundPromise = new Promise((resolve) => {
    const done = () => resolve(image);
    image.addEventListener("load", done, { once: true });
    image.addEventListener("error", () => resolve(null), { once: true });
  });
  return backgroundPromise;
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

export function updateBackgroundStars(deltaMs, level = 1) {
  const stars = ensureStarField();
  const dt = Math.max(0, deltaMs) / 1000;
  const targetLevel = Math.max(1, Number.isFinite(level) ? level : 1);
  const blend = 1 - Math.exp(-LEVEL_SMOOTHING_PER_SEC * dt);
  visualLevel = visualLevel + (targetLevel - visualLevel) * blend;
  const speedMult = getBackgroundSpeedMultiplier(visualLevel);
  for (const star of stars) {
    star.y += star.drift * speedMult * dt;
    star.x += star.driftX * speedMult * dt;
    if (star.y > 1.05) {
      star.y = -0.05;
      star.x = Math.random();
    }
    if (star.x > 1.05) {
      star.x = -0.05;
    } else if (star.x < -0.05) {
      star.x = 1.05;
    }
  }
}

export function drawBackground(ctx, render, getGlassRect, nowMs, level = 1) {
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
    drawStars(ctx, x, y, drawWidth, drawHeight, nowMs, scale, visualLevel);
    ctx.restore();
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
  }
  ctx.restore();
}

function drawStars(ctx, x, y, width, height, nowMs, scale, level) {
  const stars = ensureStarField();
  const time = (nowMs ?? 0) / 1000;
  const orbitRatio = getOrbitLevelRatio(level);
  const brightnessBoost = getBrightnessBoost(level);
  const radiusSpan = Math.max(0.0001, BACKGROUND_STAR_MAX_RADIUS - BACKGROUND_STAR_MIN_RADIUS);
  for (const star of stars) {
    const twinkle = star.twinkleEnabled
      ? star.baseAlpha +
        Math.sin(time * star.twinkleSpeed + star.phase) * star.twinkleAmp
      : star.baseAlpha;
    const alpha = Math.max(0.05, Math.min(1, twinkle * (1 + brightnessBoost)));
    ctx.fillStyle = `rgba(230, 240, 255, ${alpha.toFixed(3)})`;
    const radius = star.radius * scale;
    const baseX = x + star.x * width;
    const baseY = y + star.y * height;
    const normRadius = (star.radius - BACKGROUND_STAR_MIN_RADIUS) / radiusSpan;
    const orbitRadius =
      BACKGROUND_ORBIT_MAX_RADIUS_PX * orbitRatio * (0.35 + 0.65 * Math.max(0, Math.min(1, normRadius)));
    const microAngle = star.phase + time * BACKGROUND_ORBIT_SPEED_RAD;
    const microX = Math.cos(microAngle) * orbitRadius;
    const microY = Math.sin(microAngle) * orbitRadius;
    const sx = baseX + microX;
    const sy = baseY + microY;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getBackgroundSpeedMultiplier(level) {
  const safeLevel = Math.max(1, Number.isFinite(level) ? level : 1);
  const mult = 1 + (safeLevel - 1) * BACKGROUND_LEVEL_SPEED_STEP;
  return Math.min(BACKGROUND_LEVEL_SPEED_MAX_MULT, mult);
}

function getBrightnessBoost(level) {
  const safeLevel = Math.max(1, Number.isFinite(level) ? level : 1);
  return Math.min(
    BACKGROUND_LEVEL_BRIGHTNESS_MAX_BOOST,
    (safeLevel - 1) * BACKGROUND_LEVEL_BRIGHTNESS_STEP
  );
}

function getOrbitLevelRatio(level) {
  const safeLevel = Math.max(1, Number.isFinite(level) ? level : 1);
  const denom = Math.max(1, BACKGROUND_ORBIT_TARGET_LEVEL - 1);
  return Math.max(0, Math.min(1, (safeLevel - 1) / denom));
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}
