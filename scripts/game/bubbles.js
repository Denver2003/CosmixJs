import {
  BUBBLE_COOLDOWN_COINS_MS,
  BUBBLE_COOLDOWN_GRENADE_MS,
  BUBBLE_COOLDOWN_GUN_MS,
  BUBBLE_COOLDOWN_HAIL_MS,
  BUBBLE_COOLDOWN_POINTS1_MS,
  BUBBLE_COOLDOWN_POINTS2_MS,
  BUBBLE_COOLDOWN_POINTS3_MS,
  BUBBLE_COOLDOWN_TOUCH_MS,
  BUBBLE_DESPAWN_PAD,
  BUBBLE_FLOAT_SPEED_MAX,
  BUBBLE_FLOAT_SPEED_MIN,
  BUBBLE_MAX_COUNT,
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
  BUBBLE_SPAWN_ZONE_HEIGHT,
  BUBBLE_WAVE_AMPLITUDE,
  BUBBLE_WAVE_SPEED,
  COLORS,
  GLASS_HEIGHT,
  GLASS_WIDTH,
} from "../config.js";
import { calcBubbleMoney, calcBubbleScore } from "./rewards.js";

const SPAWN_BY_FIGURE_COUNT = [
  [4, 30],
  [5, 50],
  [6, 90],
  [7, 100],
  [999999, 100],
];

const BONUS_TABLES = {
  coins: [
    [1, 10],
    [2, 15],
    [3, 20],
    [5, 25],
    [7, 28],
    [10, 30],
    [99999, 30],
  ],
  grenade: [
    [1, 50],
    [3, 50],
    [5, 45],
    [7, 40],
    [10, 35],
    [11, 30],
    [12, 25],
    [13, 20],
    [14, 15],
    [99999, 10],
  ],
  points1: [
    [1, 100],
    [2, 80],
    [3, 70],
    [5, 60],
    [8, 50],
    [10, 40],
    [12, 40],
    [15, 40],
    [99999, 40],
  ],
  points2: [
    [1, 0],
    [2, 20],
    [3, 20],
    [5, 30],
    [8, 35],
    [10, 40],
    [12, 35],
    [15, 33],
    [99999, 33],
  ],
  points3: [
    [1, 0],
    [2, 0],
    [3, 10],
    [5, 10],
    [8, 15],
    [10, 20],
    [12, 30],
    [15, 33],
    [99999, 33],
  ],
  hail: [
    [1, 90],
    [8, 70],
    [12, 50],
    [13, 40],
    [14, 30],
    [15, 20],
    [16, 10],
    [17, 0],
    [20, 0],
    [99999, 0],
  ],
  touch: [
    [1, 0],
    [5, 0],
    [7, 1],
    [10, 2],
    [99999, 3],
  ],
  gun: [
    [1, 0],
    [5, 0],
    [7, 1],
    [10, 2],
    [99999, 3],
  ],
};
const ICON_PATHS = {
  coins: "assets/scaled/icon-coin.png",
  points1: "assets/scaled/icon_points1.png",
  points2: "assets/scaled/icon_points2.png",
  points3: "assets/scaled/icon_points3.png",
  instant_hail: "assets/scaled/icon-hail.png",
  instant_grenade: "assets/scaled/icon-grenade.png",
  consumable_touch: "assets/scaled/icon-touch.png",
  consumable_machine: "assets/scaled/icon-machine.png",
};
const ICON_CACHE = new Map();

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
    BUBBLE_FLOAT_SPEED_MIN + Math.random() * (BUBBLE_FLOAT_SPEED_MAX - BUBBLE_FLOAT_SPEED_MIN);
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
    bubble.x = bubble.baseX + Math.sin(t * BUBBLE_WAVE_SPEED + bubble.phase) * BUBBLE_WAVE_AMPLITUDE;

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

export function popBubbleAt(state, x, y) {
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
  const reward = bubble.reward;
  applyBubbleReward(state, reward);
  return reward;
}

function applyBubbleReward(state, reward) {
  if (!reward) {
    return;
  }
  const now = state.engine.timing.timestamp;
  switch (reward.type) {
    case "coins":
      state.coins += reward.amount;
      state.bubbleRewardCooldowns.coins = now + BUBBLE_COOLDOWN_COINS_MS;
      break;
    case "points":
      state.score += reward.amount;
      if (reward.subtype === "points1") {
        state.bubbleRewardCooldowns.points1 = now + BUBBLE_COOLDOWN_POINTS1_MS;
      } else if (reward.subtype === "points2") {
        state.bubbleRewardCooldowns.points2 = now + BUBBLE_COOLDOWN_POINTS2_MS;
      } else if (reward.subtype === "points3") {
        state.bubbleRewardCooldowns.points3 = now + BUBBLE_COOLDOWN_POINTS3_MS;
      }
      break;
    case "instant":
      if (reward.subtype === "hail") {
        state.bubbleRewardCooldowns.hail = now + BUBBLE_COOLDOWN_HAIL_MS;
      } else if (reward.subtype === "grenade") {
        state.bubbleRewardCooldowns.grenade = now + BUBBLE_COOLDOWN_GRENADE_MS;
      }
      console.log("[bubble] instant:", reward.subtype);
      break;
    case "consumable":
      if (reward.subtype === "touch") {
        state.bubbleRewardCooldowns.touch = now + BUBBLE_COOLDOWN_TOUCH_MS;
      } else if (reward.subtype === "machine") {
        state.bubbleRewardCooldowns.gun = now + BUBBLE_COOLDOWN_GUN_MS;
      }
      console.log("[bubble] consumable:", reward.subtype);
      break;
    default:
      break;
  }
}

function rollBubbleReward(state) {
  const now = state.engine.timing.timestamp;
  const level = state.level || 1;
  const multiplier = state.gameMultiplier || 1;
  const pointCoef = state.scoreCoef || 1;
  const moneyCoef = state.moneyCoef || 1;

  const entries = [];
  const addEntry = (key, type, subtype) => {
    const percent = getPercent(BONUS_TABLES[key], level);
    if (percent <= 0) {
      return;
    }
    entries.push({ type, subtype, weight: percent, key });
  };

  if (now >= (state.bubbleRewardCooldowns.coins || 0)) {
    addEntry("coins", "coins");
  }
  if (now >= (state.bubbleRewardCooldowns.points1 || 0)) {
    addEntry("points1", "points", "points1");
  }
  if (now >= (state.bubbleRewardCooldowns.points2 || 0)) {
    addEntry("points2", "points", "points2");
  }
  if (now >= (state.bubbleRewardCooldowns.points3 || 0)) {
    addEntry("points3", "points", "points3");
  }
  if (now >= (state.bubbleRewardCooldowns.hail || 0)) {
    addEntry("hail", "instant", "hail");
  }
  if (now >= (state.bubbleRewardCooldowns.grenade || 0)) {
    addEntry("grenade", "instant", "grenade");
  }
  if (now >= (state.bubbleRewardCooldowns.touch || 0)) {
    addEntry("touch", "consumable", "touch");
  }
  if (now >= (state.bubbleRewardCooldowns.gun || 0)) {
    addEntry("gun", "consumable", "machine");
  }

  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    return null;
  }
  const maxPercent = Math.max(100, total);
  const roll = Math.random() * maxPercent;
  if (roll >= total) {
    return null;
  }

  let pick = roll;
  let selected = null;
  for (const entry of entries) {
    pick -= entry.weight;
    if (pick <= 0) {
      selected = entry;
      break;
    }
  }
  if (!selected) {
    selected = entries[entries.length - 1];
  }

  if (selected.type === "coins") {
    const rollValue = randomInt(1, 5);
    const amount = calcBubbleMoney({ roll: rollValue, level, multiplier, moneyCoef });
    return { type: "coins", amount };
  }
  if (selected.type === "points") {
    const rollValue = randomInt(1, 5);
    let amount = calcBubbleScore({ roll: rollValue, level, multiplier, pointCoef });
    const mult = selected.subtype === "points2" ? 2 : selected.subtype === "points3" ? 4 : 1;
    amount *= mult;
    return { type: "points", subtype: selected.subtype, amount };
  }
  if (selected.type === "instant") {
    if (selected.subtype === "grenade") {
      return { type: "instant", subtype: selected.subtype, color: pickColors(state, 1)[0] };
    }
    return { type: "instant", subtype: selected.subtype };
  }
  if (selected.type === "consumable") {
    return { type: "consumable", subtype: selected.subtype };
  }
  return null;
}

function getPercent(table, value) {
  for (const [threshold, percent] of table) {
    if (threshold >= value) {
      return percent;
    }
  }
  return 0;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function pickColors(state, count) {
  const limit = Math.max(1, Math.min(COLORS.length, state.colorsCount || 4));
  const palette = COLORS.slice(0, limit);
  const picks = [];
  for (let i = 0; i < count; i += 1) {
    picks.push(palette[Math.floor(Math.random() * palette.length)]);
  }
  return picks;
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
  ctx.drawImage(icon, -half, -half, size, size);
  if (reward.type === "instant" && reward.subtype === "grenade" && reward.color) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = hexToRgbaSafe(reward.color, 0.65);
    ctx.fillRect(-half, -half, size, size);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
}

function getIconKey(reward) {
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

function getIcon(key) {
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
