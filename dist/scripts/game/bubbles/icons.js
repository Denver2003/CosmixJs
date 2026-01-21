import { ICON_PATHS } from "./constants.js";

const ICON_CACHE = new Map();
const TINT_CACHE = new Map();

export function preloadIcons() {
  for (const key of Object.keys(ICON_PATHS || {})) {
    getIcon(key);
  }
}

export function drawBubbleIcon(ctx, x, y, size, reward) {
  if (!reward) {
    return;
  }
  const key = getIconKey(reward);
  const icon = getIcon(key);
  if (!icon || icon._broken || !icon.complete || icon.naturalWidth === 0) {
    return;
  }
  const half = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (reward.type === "instant" && reward.subtype === "grenade" && reward.color) {
    const tinted = getTintedIcon(key, reward.color, 0.65);
    if (tinted) {
      ctx.drawImage(tinted, -half, -half, size, size);
    } else {
      ctx.drawImage(icon, -half, -half, size, size);
    }
  } else {
    ctx.drawImage(icon, -half, -half, size, size);
  }
  ctx.restore();
}

export function getIconKey(reward) {
  if (reward.type === "coins") {
    return "coins";
  }
  if (reward.type === "points") {
    return reward.subtype || "points1";
  }
  if (reward.type === "instant") {
    return reward.subtype === "grenade" ? "instant_grenade" : "instant_hail";
  }
  if (reward.type === "consumable") {
    return reward.subtype === "touch" ? "consumable_touch" : "consumable_machine";
  }
  return null;
}

export function getIcon(key) {
  if (!key || !ICON_PATHS[key]) {
    return null;
  }
  if (ICON_CACHE.has(key)) {
    return ICON_CACHE.get(key);
  }
  const image = new Image();
  image.onerror = () => {
    image._broken = true;
  };
  image.src = ICON_PATHS[key];
  ICON_CACHE.set(key, image);
  return image;
}

function getTintedIcon(key, color, alpha) {
  if (!key || !color) {
    return null;
  }
  const icon = getIcon(key);
  if (!icon || icon._broken || !icon.complete || icon.naturalWidth === 0) {
    return null;
  }
  const cacheKey = `${key}|${color}|${alpha}`;
  if (TINT_CACHE.has(cacheKey)) {
    return TINT_CACHE.get(cacheKey);
  }
  const canvas = document.createElement("canvas");
  canvas.width = icon.naturalWidth;
  canvas.height = icon.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(icon, 0, 0);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = hexToRgbaSafe(color, alpha);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  TINT_CACHE.set(cacheKey, canvas);
  return canvas;
}

function hexToRgbaSafe(hex, alpha) {
  if (!hex || !hex.startsWith("#")) {
    return `rgba(255, 255, 255, ${alpha})`;
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
    return `rgba(255, 255, 255, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
