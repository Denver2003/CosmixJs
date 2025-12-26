import { applyLevelProgress, createGameState } from "./state.js";
import { attachControls } from "./controls.js";
import { drawLines } from "./lines.js";
import { updateChains } from "./chains/index.js";
import { updateKillLine } from "./kill.js";
import { updatePreview, repositionPreview } from "./preview.js";
import { spawnBlock, updateSpawn, repositionWaiting } from "./spawn.js";
import { createPauseController } from "./pause.js";
import { applyChainRewards, applyLevelUpReward } from "./rewards.js";
import { saveCoins } from "./storage.js";
import { spawnScoreParticles } from "./score_particles.js";
import { recordCombo } from "./combo.js";
import { spawnComboPopup } from "./combo_popup.js";
import { updateCosmometer, updateCosmometerMultiplier } from "./cosmometer.js";
import { trySpawnBubble } from "./bubbles.js";
import { GLASS_WIDTH, IMPACT_FLASH_DURATION_MS, SPAWN_OFFSET } from "../config.js";

const { Events } = Matter;

export function createGame({ engine, world, render, runner, getGlassRect }) {
  const state = createGameState();
  state.engine = engine;
  state.world = world;
  const pause = createPauseController(state, runner);

  function getSpawnPoint() {
    const { left, top } = getGlassRect();
    return {
      x: left + GLASS_WIDTH / 2,
      y: top + SPAWN_OFFSET,
    };
  }

  function update() {
    if (state.gameOver) {
      if (!state.gameOverHandled) {
        saveCoins(state.coins);
        state.gameOverHandled = true;
      }
      return;
    }
    if (state.paused) {
      return;
    }
    const deltaMs = engine.timing.lastDelta;
    updateCosmometer(state, deltaMs);
    const prevMultiplier = state.gameMultiplier;
    updateCosmometerMultiplier(state, engine.timing.timestamp);
    updateSpawn(state, getSpawnPoint, getGlassRect, deltaMs);
    updateKillLine(state, getGlassRect, deltaMs);
    const { removedCount, removedComponents, removedComponentBodies } =
      updateChains(state, deltaMs);
    if (removedCount) {
      const comboInfo = recordCombo(state, engine.timing.timestamp);
      if (comboInfo?.multiplier > 1) {
        const allBodies = [];
        for (const group of removedComponentBodies) {
          for (const body of group) {
            allBodies.push(body);
          }
        }
        spawnComboPopup(state, getGlassRect, allBodies, comboInfo.multiplier);
      }
      trySpawnBubble(
        state,
        getGlassRect,
        "collapse",
        removedCount,
        comboInfo?.chainCount || 0
      );
      const { breakdown } = applyChainRewards(state, removedComponents);
      if (comboInfo && comboInfo.multiplier > 1) {
        console.log(
          "[combo]",
          `x${comboInfo.multiplier}`,
          "chains:",
          comboInfo.chainCount,
          "windowMs:",
          comboInfo.windowMs
        );
      }
      spawnScoreParticles(
        state,
        render,
        removedComponentBodies,
        breakdown
      );
      console.log(
        "[level]",
        "cleared:",
        state.clearedThisLevel + removedCount,
        "/",
        state.toNextLevel
      );
      const { leveledUp, prevToNextLevel } = applyLevelProgress(
        state,
        removedCount
      );
      if (leveledUp) {
        applyLevelUpReward(state, prevToNextLevel);
      }
    }
    updatePreview(state, engine.timing.timestamp);

    if (state.gameMultiplier !== prevMultiplier) {
      console.log(
        "[cosmo]",
        "energy:",
        state.energy.toFixed(1),
        "x",
        state.gameMultiplier
      );
    }
  }

  function draw() {
    drawLines(state, render, getGlassRect);
  }

  Events.on(engine, "afterUpdate", update);
  Events.on(render, "afterRender", draw);
  Events.on(engine, "collisionStart", (event) => {
    const now = engine.timing.timestamp;
    for (const pair of event.pairs) {
      const bodyA = pair.bodyA.parent || pair.bodyA;
      const bodyB = pair.bodyB.parent || pair.bodyB;
      if (bodyA === bodyB) {
        continue;
      }
      armFlash(bodyA, now);
      armFlash(bodyB, now);
    }
  });

  const detachControls = attachControls(
    state,
    getSpawnPoint,
    getGlassRect,
    pause.togglePause,
    render,
    render?.canvas
  );

  function onResize() {
    repositionWaiting(state, getSpawnPoint, getGlassRect);
    repositionPreview(state, getSpawnPoint);
  }

  function setViewScale(scale) {
    state.viewScale = scale;
  }

  function setViewSize(width, height) {
    state.viewWidth = width;
    state.viewHeight = height;
  }

  function start() {
    spawnBlock(state, getSpawnPoint);
  }

  return {
    start,
    onResize,
    detachControls,
    setViewScale,
    setViewSize,
    setPaused: pause.setPaused,
    resumeIfAuto: pause.resumeIfAuto,
    tickAutoResume: pause.tickAutoResume,
    getPauseInfo: pause.getPauseInfo,
  };
}

function armFlash(body, nowMs) {
  if (!body || !body.plugin?.impactArmed) {
    return;
  }
  body.plugin = {
    ...(body.plugin || {}),
    impactArmed: false,
    flashStartMs: nowMs,
    flashDurationMs: IMPACT_FLASH_DURATION_MS,
  };
}
