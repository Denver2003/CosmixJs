import { getTopHudLayout } from "../ui/hud.js";

const DURATION_MS = 1200;

function worldToScreen(render, x, y) {
  const bounds = render.bounds;
  const width = render.options.width;
  const height = render.options.height;
  const scaleX = width / (bounds.max.x - bounds.min.x);
  const scaleY = height / (bounds.max.y - bounds.min.y);
  return {
    x: (x - bounds.min.x) * scaleX,
    y: (y - bounds.min.y) * scaleY,
  };
}

export function spawnRewardFloater(
  state,
  render,
  type,
  worldX,
  worldY,
  value,
  color
) {
  if (!value) {
    return;
  }
  const pos = worldToScreen(render, worldX, worldY);
  const vx = (Math.random() - 0.5) * 40;
  const vy = -40 - Math.random() * 30;
  state.rewardFloaters.push({
    type,
    value,
    color,
    x: pos.x,
    y: pos.y,
    vx,
    vy,
    startMs: state.engine.timing.timestamp,
    durationMs: DURATION_MS,
  });
}

export function updateRewardFloaters(state, render, getGlassRect) {
  const floaters = state.rewardFloaters;
  if (!floaters || floaters.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const dt = (state.engine.timing.lastDelta || 0) / 1000;
  const layout = getTopHudLayout(state, render, getGlassRect);
  const scoreTarget = { x: layout.leftX, y: layout.valueY };
  const coinsTarget = { x: layout.pause.x - layout.coinsGap, y: layout.valueY };
  const next = [];
  for (const floater of floaters) {
    const t = (now - floater.startMs) / floater.durationMs;
    if (t >= 1) {
      continue;
    }
    const target = floater.type === "coins" ? coinsTarget : scoreTarget;
    const dx = target.x - floater.x;
    const dy = target.y - floater.y;
    const magnet = 2 + 6 * t;
    floater.vx += dx * magnet * dt;
    floater.vy += dy * magnet * dt;
    floater.vx *= 0.9;
    floater.vy *= 0.9;
    floater.x += floater.vx * dt;
    floater.y += floater.vy * dt;
    floater.alpha = Math.max(0, 1 - t);
    next.push(floater);
  }
  state.rewardFloaters = next;
}

export function drawRewardFloaters(state, ctx) {
  const floaters = state.rewardFloaters;
  if (!floaters || floaters.length === 0) {
    return;
  }
  ctx.save();
  for (const floater of floaters) {
    const alpha = Math.max(0, Math.min(1, floater.alpha ?? 1));
    ctx.fillStyle = colorWithAlpha(floater.color || "#ffffff", alpha);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (floater.type === "coins") {
      ctx.font = "bold 32px \"RussoOne\", sans-serif";
    } else {
      ctx.font = "28px \"RussoOne\", sans-serif";
    }
    ctx.fillText(`+${floater.value}`, floater.x, floater.y);
  }
  ctx.restore();
}

function colorWithAlpha(hex, alpha) {
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
