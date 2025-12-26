import {
  GLASS_HEIGHT,
  GLASS_WIDTH,
  HAIL_ANGULAR_SPEED,
  HAIL_DROP_SPEED,
  HAIL_EXTRA_COUNT,
  HAIL_RESPAWN_POINTS,
  HAIL_SPAWN_Y_OFFSET,
} from "../../config.js";
import { createRandomSpec, createShape } from "../../shapes.js";
import { applyLevelProgress } from "../state.js";
import { startBurst } from "../chains/effects.js";
import { addEnergyOnDrop, updateCosmometerMultiplier } from "../cosmometer.js";
import { recordCombo } from "../combo.js";
import { applyChainRewards, applyLevelUpReward } from "../rewards.js";
import { spawnScoreParticles } from "../score_particles.js";
import { spawnComboPopup } from "../combo_popup.js";

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
    if (
      state.waitingBody &&
      (body === state.waitingBody || body.parent === state.waitingBody)
    ) {
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
