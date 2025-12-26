import {
  BONUS_COOLDOWN_MS,
  BONUS_GUN_INTERVAL_MS,
  BONUS_GUN_SHOTS,
  BONUS_TOUCH_DURATION_MS,
  GLASS_HEIGHT,
  GLASS_WIDTH,
} from "../../config.js";
import { applyLevelProgress } from "../state.js";
import { startBurst } from "../chains/effects.js";
import { recordCombo } from "../combo.js";
import { applyChainRewards, applyLevelUpReward } from "../rewards.js";
import { spawnScoreParticles } from "../score_particles.js";
import { spawnComboPopup } from "../combo_popup.js";
import { spawnLevelUpPopup } from "../level_up_popup.js";
import { buildGunRays } from "./gun_marks.js";

const { Composite } = Matter;

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
    if (
      state.waitingBody &&
      (body === state.waitingBody || body.parent === state.waitingBody)
    ) {
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
  const removedComponents = [
    { ids: new Set(bodies.map((body) => body.id)), color },
  ];
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
    if (getGlassRect) {
      spawnLevelUpPopup(state, getGlassRect, state.level);
    }
  }
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
