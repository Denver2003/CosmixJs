import {
  BONUS_COOLDOWN_MS,
  BONUS_GUN_INTERVAL_MS,
  BONUS_GUN_SHOTS,
  BONUS_TOUCH_DURATION_MS,
  GLASS_HEIGHT,
  GLASS_WIDTH,
  HAIL_ANGULAR_SPEED,
  HAIL_DROP_SPEED,
  HAIL_EXTRA_COUNT,
  HAIL_RESPAWN_POINTS,
  HAIL_SPAWN_Y_OFFSET,
} from "../config.js";
import { createRandomSpec, createShape } from "../shapes.js";
import { applyLevelProgress } from "./state.js";
import { startBurst } from "./chains/effects.js";
import { addEnergyOnDrop, updateCosmometerMultiplier } from "./cosmometer.js";
import { recordCombo } from "./combo.js";
import { applyChainRewards, applyLevelUpReward } from "./rewards.js";
import { spawnScoreParticles } from "./score_particles.js";
import { spawnComboPopup } from "./combo_popup.js";

const { Body, Composite, World } = Matter;

export function triggerHail(state, getGlassRect) {
  if (state.gameOver) {
    return 0;
  }
  const points = buildHailPoints(getGlassRect);
  if (!points.length) {
    return 0;
  }
  const base = Math.max(0, points.length - 4);
  const extra = Math.floor(Math.random() * HAIL_EXTRA_COUNT);
  const fallCount = Math.min(points.length, base + extra);
  if (fallCount <= 0) {
    return 0;
  }
  const indices = points.map((_, idx) => idx);
  let spawned = 0;
  for (let i = 0; i < fallCount; i += 1) {
    const pick = Math.floor(Math.random() * indices.length);
    const pointIndex = indices.splice(pick, 1)[0];
    const spawnPoint = points[pointIndex];
    const spec = createRandomSpec(state.colorsCount, state.rotationRange);
    const body = createShape(spec, spawnPoint);
    Body.setVelocity(body, { x: 0, y: HAIL_DROP_SPEED });
    Body.setAngularVelocity(
      body,
      (Math.random() - 0.5) * HAIL_ANGULAR_SPEED * 2
    );
    World.add(state.world, body);
    addEnergyOnDrop(state);
    spawned += 1;
  }
  updateCosmometerMultiplier(state, state.engine.timing.timestamp);
  return spawned;
}

export function triggerGrenade(state, targetColor, getGlassRect) {
  if (!targetColor) {
    return 0;
  }
  const bodies = Composite.allBodies(state.world).filter((body) => {
    if (body.isStatic || body.parent !== body) {
      return false;
    }
    if (state.waitingBody && (body === state.waitingBody || body.parent === state.waitingBody)) {
      return false;
    }
    if (body.plugin?.burst?.active) {
      return false;
    }
    if (body.plugin?.preview) {
      return false;
    }
    return body.plugin?.color === targetColor;
  });

  if (!bodies.length) {
    return 0;
  }
  startBurst(state, bodies);
  const removedCount = bodies.length;
  const now = state.engine.timing.timestamp;
  const comboInfo = recordCombo(state, now);
  if (comboInfo?.multiplier > 1 && getGlassRect && state.render) {
    spawnComboPopup(state, getGlassRect, bodies, comboInfo.multiplier);
  }
  const removedComponents = [
    { ids: new Set(bodies.map((body) => body.id)), color: targetColor },
  ];
  const { breakdown } = applyChainRewards(state, removedComponents);
  if (state.render) {
    spawnScoreParticles(state, state.render, [bodies], breakdown);
  }
  const { leveledUp, prevToNextLevel } = applyLevelProgress(state, removedCount);
  if (leveledUp) {
    applyLevelUpReward(state, prevToNextLevel);
  }
  return removedCount;
}

export function activateTouchBonus(state) {
  const now = state.engine.timing.timestamp;
  if (state.bonusInventory.touch <= 0) {
    return false;
  }
  if (now < (state.bonusCooldowns.touchUntil || 0)) {
    return false;
  }
  state.bonusInventory.touch -= 1;
  state.bonusCooldowns.touchUntil = now + BONUS_COOLDOWN_MS;
  state.bonusTouchActiveUntil = now + BONUS_TOUCH_DURATION_MS;
  return true;
}

export function activateGunBonus(state, getGlassRect) {
  const now = state.engine.timing.timestamp;
  if (state.bonusInventory.gun <= 0) {
    return false;
  }
  if (now < (state.bonusCooldowns.gunUntil || 0)) {
    return false;
  }
  state.bonusInventory.gun -= 1;
  state.bonusCooldowns.gunUntil = now + BONUS_COOLDOWN_MS;
  state.bonusGunShots = buildGunShots(now, getGlassRect);
  return true;
}

export function updateGunBonus(state, getGlassRect) {
  const shots = state.bonusGunShots;
  if (!shots || shots.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const remaining = [];
  for (const shot of shots) {
    if (now < shot.at) {
      remaining.push(shot);
      continue;
    }
    fireGunShot(state, shot.x, shot.y, getGlassRect);
  }
  state.bonusGunShots = remaining;
}

export function tryTouchKill(state, x, y, getGlassRect) {
  const now = state.engine.timing.timestamp;
  if (!state.bonusTouchActiveUntil || now > state.bonusTouchActiveUntil) {
    return false;
  }
  const bodies = Composite.allBodies(state.world);
  const hit = Matter.Query.point(bodies, { x, y })
    .map((body) => body.parent || body)
    .find((body) => body && !body.isStatic && body.parent === body);
  if (!hit) {
    return false;
  }
  const color = hit.plugin?.color;
  if (!color) {
    return false;
  }
  const componentBodies = collectColorComponent(state, hit, color);
  if (!componentBodies.length) {
    return false;
  }
  triggerComponentRemoval(state, componentBodies, color, getGlassRect);
  return true;
}

function fireGunShot(state, x, y, getGlassRect) {
  state.bonusGunMarks.push({
    x,
    y,
    startMs: state.engine.timing.timestamp,
    rays: buildGunRays(),
  });
  const bodies = Composite.allBodies(state.world);
  const hit = Matter.Query.point(bodies, { x, y })
    .map((body) => body.parent || body)
    .find((body) => body && !body.isStatic && body.parent === body);
  if (!hit) {
    return;
  }
  const color = hit.plugin?.color;
  if (!color) {
    return;
  }
  const componentBodies = collectColorComponent(state, hit, color);
  if (componentBodies.length >= 2) {
    triggerComponentRemoval(state, componentBodies, color, getGlassRect);
    return;
  }
  triggerComponentRemoval(state, [hit], color, getGlassRect);
}

function collectColorComponent(state, startBody, color) {
  const bodies = Composite.allBodies(state.world).filter((body) => {
    if (body.isStatic || body.parent !== body) {
      return false;
    }
    if (state.waitingBody && (body === state.waitingBody || body.parent === state.waitingBody)) {
      return false;
    }
    if (body.plugin?.burst?.active) {
      return false;
    }
    return true;
  });
  const bodyById = new Map(bodies.map((body) => [body.id, body]));
  const adjacency = new Map();
  for (const body of bodies) {
    adjacency.set(body.id, new Set());
  }
  for (const pair of state.engine.pairs.list) {
    const bodyA = pair.bodyA.parent || pair.bodyA;
    const bodyB = pair.bodyB.parent || pair.bodyB;
    if (bodyA === bodyB) {
      continue;
    }
    if (!adjacency.has(bodyA.id) || !adjacency.has(bodyB.id)) {
      continue;
    }
    if (bodyA.plugin?.color !== color || bodyB.plugin?.color !== color) {
      continue;
    }
    adjacency.get(bodyA.id).add(bodyB.id);
    adjacency.get(bodyB.id).add(bodyA.id);
  }

  const stack = [startBody];
  const visited = new Set([startBody.id]);
  const component = [];
  while (stack.length) {
    const current = stack.pop();
    component.push(current);
    for (const neighborId of adjacency.get(current.id) || []) {
      if (visited.has(neighborId)) {
        continue;
      }
      const neighbor = bodyById.get(neighborId);
      if (!neighbor) {
        continue;
      }
      visited.add(neighborId);
      stack.push(neighbor);
    }
  }
  return component;
}

function triggerComponentRemoval(state, bodies, color, getGlassRect) {
  if (!bodies.length) {
    return;
  }
  startBurst(state, bodies);
  const removedComponents = [{ ids: new Set(bodies.map((body) => body.id)), color }];
  const comboInfo = recordCombo(state, state.engine.timing.timestamp);
  if (comboInfo?.multiplier > 1 && getGlassRect && state.render) {
    spawnComboPopup(state, getGlassRect, bodies, comboInfo.multiplier);
  }
  const { breakdown } = applyChainRewards(state, removedComponents);
  if (state.render) {
    spawnScoreParticles(state, state.render, [bodies], breakdown);
  }
  const { leveledUp, prevToNextLevel } = applyLevelProgress(state, bodies.length);
  if (leveledUp) {
    applyLevelUpReward(state, prevToNextLevel);
  }
}

export function updateGunMarks(state) {
  const marks = state.bonusGunMarks;
  if (!marks || marks.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  const next = [];
  for (const mark of marks) {
    if (now - mark.startMs <= 2000) {
      next.push(mark);
    }
  }
  state.bonusGunMarks = next;
}

export function drawGunMarks(state, ctx) {
  const marks = state.bonusGunMarks;
  if (!marks || marks.length === 0) {
    return;
  }
  const now = state.engine.timing.timestamp;
  ctx.save();
  for (const mark of marks) {
    const t = Math.min(1, (now - mark.startMs) / 2000);
    const alpha = 1 - t;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    for (const ray of mark.rays || []) {
      ctx.moveTo(mark.x, mark.y);
      ctx.lineTo(mark.x + ray.x, mark.y + ray.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function buildGunShots(now, getGlassRect) {
  const { left, top } = getGlassRect();
  const startY = top + GLASS_HEIGHT * 0.15;
  const endY = top + GLASS_HEIGHT * 0.85;
  const fullSpreadX = GLASS_WIDTH * 0.46;
  const fullSpreadY = GLASS_HEIGHT * 0.08;
  const shots = [];
  for (let i = 0; i < BONUS_GUN_SHOTS; i += 1) {
    const t = BONUS_GUN_SHOTS > 1 ? i / (BONUS_GUN_SHOTS - 1) : 1;
    const centerX = left + GLASS_WIDTH / 2;
    const zig = Math.sin(t * Math.PI * 4);
    const baseX = centerX + zig * fullSpreadX;
    const baseY = startY + (endY - startY) * t;
    const x = baseX + (Math.random() - 0.5) * fullSpreadX * 0.3;
    const y = baseY + (Math.random() - 0.5) * fullSpreadY;
    shots.push({
      at: now + i * BONUS_GUN_INTERVAL_MS,
      x,
      y,
    });
  }
  return shots;
}

function buildGunRays() {
  const rays = [];
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const length = 5 + Math.random() * 6;
    rays.push({ x: Math.cos(angle) * length, y: Math.sin(angle) * length });
  }
  return rays;
}

function buildHailPoints(getGlassRect) {
  const { left, top } = getGlassRect();
  const count = Math.max(1, HAIL_RESPAWN_POINTS);
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const t = (i + 1) / (count + 1);
    points.push({
      x: left + GLASS_WIDTH * t,
      y: top - HAIL_SPAWN_Y_OFFSET,
    });
  }
  return points;
}
