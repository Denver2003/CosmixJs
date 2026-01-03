import {
  BUBBLE_MAX_RADIUS,
  BUBBLE_MIN_RADIUS,
  BUBBLE_POP_BURST_MS,
  BUBBLE_POP_COUNT_MAX,
  BUBBLE_POP_COUNT_MIN,
  BUBBLE_POP_FALL_MS,
  BUBBLE_POP_GRAVITY,
  BUBBLE_POP_ICON_MS,
  BUBBLE_POP_RADIUS_MAX,
  BUBBLE_POP_RADIUS_MIN,
  BUBBLE_POP_SPEED,
} from "../../config.js";
import { getIcon, getIconKey } from "./icons.js";
import { applyBubbleReward } from "./rewards.js";

export function spawnBubblePopParticles(state, x, y, radius) {
  const ratio =
    BUBBLE_MAX_RADIUS > BUBBLE_MIN_RADIUS
      ? Math.max(0, Math.min(1, (radius - BUBBLE_MIN_RADIUS) / (BUBBLE_MAX_RADIUS - BUBBLE_MIN_RADIUS)))
      : 0;
  const countBase =
    BUBBLE_POP_COUNT_MIN +
    Math.round((BUBBLE_POP_COUNT_MAX - BUBBLE_POP_COUNT_MIN) * ratio);
  const count = Math.round(countBase * 1.3);
  const now = state.engine.timing.timestamp;
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = BUBBLE_POP_SPEED * (0.6 + Math.random() * 0.6);
    const dropRadius =
      BUBBLE_POP_RADIUS_MIN +
      Math.random() * (BUBBLE_POP_RADIUS_MAX - BUBBLE_POP_RADIUS_MIN);
    state.bubblePopParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: dropRadius,
      startMs: now,
    });
  }
}

export function spawnBubblePopIcon(state, x, y, reward) {
  const key = getIconKey(reward);
  const icon = getIcon(key);
  if (!icon) {
    return;
  }
  state.bubblePopIcons.push({
    x,
    y,
    iconKey: key,
    startMs: state.engine.timing.timestamp,
  });
}

export function updateBubblePopIcons(state) {
  const icons = state.bubblePopIcons;
  if (!icons || icons.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const next = [];
  for (const icon of icons) {
    if (now - icon.startMs <= BUBBLE_POP_ICON_MS) {
      next.push(icon);
    }
  }
  state.bubblePopIcons = next;
}

export function drawBubblePopIcons(state, ctx) {
  const icons = state.bubblePopIcons;
  if (!icons || icons.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  ctx.save();
  for (const icon of icons) {
    const iconImage = getIcon(icon.iconKey);
    if (!iconImage || !iconImage.complete) {
      continue;
    }
    const t = Math.max(0, Math.min(1, (now - icon.startMs) / BUBBLE_POP_ICON_MS));
    const scale = 1 + 0.4 * t;
    const alpha = 1 - t;
    const size = 22 * scale;
    ctx.globalAlpha = alpha;
    ctx.drawImage(iconImage, icon.x - size / 2, icon.y - size / 2, size, size);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function updateBubblePopParticles(state, deltaMs) {
  const particles = state.bubblePopParticles;
  if (!particles || particles.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const dt = deltaMs / 1000;
  const next = [];
  for (const particle of particles) {
    const elapsed = now - particle.startMs;
    if (elapsed >= BUBBLE_POP_BURST_MS + BUBBLE_POP_FALL_MS) {
      continue;
    }
    if (elapsed <= BUBBLE_POP_BURST_MS) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    } else {
      particle.vy += BUBBLE_POP_GRAVITY * dt;
      particle.x += particle.vx * dt * 0.6;
      particle.y += particle.vy * dt;
    }
    next.push(particle);
  }
  state.bubblePopParticles = next;
}

export function drawBubblePopParticles(state, ctx) {
  const particles = state.bubblePopParticles;
  if (!particles || particles.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  ctx.save();
  for (const particle of particles) {
    const elapsed = now - particle.startMs;
    const fadeStart = BUBBLE_POP_BURST_MS;
    let alpha = 1;
    if (elapsed >= fadeStart) {
      const t = Math.min(1, (elapsed - fadeStart) / BUBBLE_POP_FALL_MS);
      alpha = 1 - t;
    }
    const isOutline = Math.random() < 0.5;
    if (isOutline) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 0.9)})`;
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.35})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    if (isOutline) {
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function popBubbleAt(state, x, y, getGlassRect) {
  const bubbles = state.bubbles;
  if (!bubbles || bubbles.length === 0) {
    return null;
  }
  let hitIndex = -1;
  for (let i = bubbles.length - 1; i >= 0; i -= 1) {
    const bubble = bubbles[i];
    const dx = x - bubble.x;
    const dy = y - bubble.y;
    if (dx * dx + dy * dy <= bubble.radius * bubble.radius) {
      hitIndex = i;
      break;
    }
  }
  if (hitIndex < 0) {
    return null;
  }
  const [bubble] = bubbles.splice(hitIndex, 1);
  if (!bubble) {
    return null;
  }
  spawnBubblePopParticles(state, bubble.x, bubble.y, bubble.radius);
  spawnBubblePopIcon(state, bubble.x, bubble.y, bubble.reward);
  const reward = { ...bubble.reward, x: bubble.x, y: bubble.y };
  applyBubbleReward(state, reward, getGlassRect);
  return reward;
}

export function popTopBubble(state, getGlassRect) {
  const bubbles = state.bubbles;
  if (!bubbles || bubbles.length === 0) {
    return null;
  }
  let topIndex = -1;
  let topY = Infinity;
  for (let i = 0; i < bubbles.length; i += 1) {
    if (bubbles[i].y < topY) {
      topY = bubbles[i].y;
      topIndex = i;
    }
  }
  if (topIndex < 0) {
    return null;
  }
  const [bubble] = bubbles.splice(topIndex, 1);
  if (!bubble) {
    return null;
  }
  spawnBubblePopParticles(state, bubble.x, bubble.y, bubble.radius);
  spawnBubblePopIcon(state, bubble.x, bubble.y, bubble.reward);
  const reward = { ...bubble.reward, x: bubble.x, y: bubble.y };
  applyBubbleReward(state, reward, getGlassRect);
  return reward;
}
