import { ICON_PATHS } from "./constants.js";

const ICON_CACHE = new Map();

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
  ctx.drawImage(icon, -half, -half, size, size);
  if (reward.type === "instant" && reward.subtype === "grenade" && reward.color) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = hexToRgbaSafe(reward.color, 0.65);
    ctx.fillRect(-half, -half, size, size);
    ctx.globalCompositeOperation = "source-over";
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
