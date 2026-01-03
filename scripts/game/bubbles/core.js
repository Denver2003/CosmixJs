import {
  BUBBLE_DESPAWN_PAD,
  BUBBLE_FLOAT_SPEED_MAX,
  BUBBLE_FLOAT_SPEED_MIN,
  BUBBLE_MAX_COUNT,
  BUBBLE_MAX_RADIUS,
  BUBBLE_MIN_RADIUS,
  BUBBLE_SPAWN_ZONE_HEIGHT,
  BUBBLE_WAVE_AMPLITUDE,
  BUBBLE_WAVE_SPEED,
  GLASS_HEIGHT,
  GLASS_WIDTH,
} from "../../config.js";
import { SPAWN_BY_FIGURE_COUNT } from "./constants.js";
import { rollBubbleReward } from "./rewards.js";
import { drawBubbleIcon } from "./icons.js";
import { getPercent } from "./utils.js";

export function trySpawnBubble(
  state,
  getGlassRect,
  source = "collapse",
  removedCount = 0,
  comboCount = 0
) {
  if (source === "collapse") {
    if (removedCount < 4) {
      return null;
    }
    const totalCount = removedCount + comboCount;
    const percent = getPercent(SPAWN_BY_FIGURE_COUNT, totalCount);
    if (Math.random() * 100 >= percent) {
      return null;
    }
  }
  if (state.bubbles.length >= BUBBLE_MAX_COUNT) {
    return null;
  }
  const reward = rollBubbleReward(state);
  if (!reward) {
    return null;
  }
  const bubble = createBubble(state, getGlassRect, reward, source);
  state.bubbles.push(bubble);
  return bubble;
}

function createBubble(state, getGlassRect, reward, source) {
  const glass = getGlassRect();
  const radius =
    BUBBLE_MIN_RADIUS + Math.random() * (BUBBLE_MAX_RADIUS - BUBBLE_MIN_RADIUS);
  const x = glass.left + radius + Math.random() * (GLASS_WIDTH - radius * 2);
  const spawnBottom = glass.top + GLASS_HEIGHT;
  const y = spawnBottom - Math.random() * BUBBLE_SPAWN_ZONE_HEIGHT;
  const speed =
    BUBBLE_FLOAT_SPEED_MIN +
    Math.random() * (BUBBLE_FLOAT_SPEED_MAX - BUBBLE_FLOAT_SPEED_MIN);
  const phase = Math.random() * Math.PI * 2;
  return {
    x,
    y,
    baseX: x,
    radius,
    speed,
    phase,
    bornMs: state.engine.timing.timestamp,
    reward,
    source,
  };
}

export function updateBubbles(state, deltaMs, getGlassRect) {
  const bubbles = state.bubbles;
  if (!bubbles || bubbles.length === 0) {
    return;
  }
  const glass = getGlassRect();
  const dt = deltaMs / 1000;
  const now = state.engine.timing.timestamp;
  const next = [];
  for (const bubble of bubbles) {
    const t = (now - bubble.bornMs) / 1000;
    bubble.y -= bubble.speed * dt;
    bubble.x =
      bubble.baseX +
      Math.sin(t * BUBBLE_WAVE_SPEED + bubble.phase) * BUBBLE_WAVE_AMPLITUDE;

    const leftBound = glass.left - BUBBLE_DESPAWN_PAD;
    const rightBound = glass.left + GLASS_WIDTH + BUBBLE_DESPAWN_PAD;
    const topBound = glass.top - BUBBLE_DESPAWN_PAD;
    if (bubble.x + bubble.radius < leftBound || bubble.x - bubble.radius > rightBound) {
      continue;
    }
    if (bubble.y + bubble.radius < topBound) {
      continue;
    }
    next.push(bubble);
  }
  state.bubbles = next;
}

export function drawBubbles(state, ctx) {
  const bubbles = state.bubbles;
  if (!bubbles || bubbles.length === 0) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  for (const bubble of bubbles) {
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const highlightRadius = bubble.radius * 0.25;
    const highlightX = bubble.x - bubble.radius * 0.35;
    const highlightY = bubble.y - bubble.radius * 0.35;
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
    ctx.fill();
    drawBubbleIcon(ctx, bubble.x, bubble.y, bubble.radius * 1.56, bubble.reward);
  }
  ctx.restore();
}
