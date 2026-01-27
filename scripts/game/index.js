import { applyLevelProgress, createGameState } from "./state.js";
import { applyShopToGameState } from "../shop/progression.js";
import { createGameStateMachine } from "./state_machine.js";
import { attachControls } from "./controls.js";
import { drawLines } from "./lines.js";
import { updateChains } from "./chains/index.js";
import { updateKillLine } from "./kill.js";
import { updatePreview, repositionPreview } from "./preview.js";
import { spawnBlock, updateSpawn, repositionWaiting } from "./spawn.js";
import { applyChainRewards, applyLevelUpReward } from "./rewards.js";
import {
  loadBestScore,
  loadCoins,
  saveBestScore,
  saveBonusInventory,
  saveCoins,
} from "./storage.js";
import { spawnScoreParticles, updateScoreParticles } from "./score_particles.js";
import { recordCombo } from "./combo.js";
import { spawnComboPopup, updateComboPopups } from "./combo_popup.js";
import { updateCosmometer, updateCosmometerMultiplier } from "./cosmometer.js";
import { trySpawnBubble, updateBubbles, updateBubblePopIcons, updateBubblePopParticles } from "./bubbles.js";
import { updateGunBonus, updateGunMarks } from "./bonuses.js";
import { spawnLevelUpPopup, updateLevelUpPopups } from "./level_up_popup.js";
import { updateRewardFloaters } from "./reward_floaters.js";
import { resetTutorialForRun, updateTutorial } from "./tutorial.js";
import { GLASS_WIDTH, IMPACT_FLASH_DURATION_MS, SPAWN_OFFSET } from "../config.js";
import { updateBackgroundStars } from "./background.js";
import { playMusic, playSfx, preloadAudio } from "../audio/index.js";
import { submitLeaderboardScore } from "../leaderboards/index.js";
import { queueCloudSave } from "../cloud/index.js";
import { buildCloudPayload } from "../cloud/state.js";
import { createRunId } from "../analytics/ids.js";
import { trackLevelUp, trackRunEnd, trackRunStart } from "../analytics/events.js";

const { Events } = Matter;

export function createGame({ engine, world, render, runner, getGlassRect }) {
  const state = createGameState();
  state.engine = engine;
  state.world = world;
  state.render = render;
  state.spawnBlockResumeAt = 0;
  const mode = createGameStateMachine(state, runner);
  mode.openShell();

  function getSpawnPoint() {
    const { left, top } = getGlassRect();
    return {
      x: left + GLASS_WIDTH / 2,
      y: top + SPAWN_OFFSET,
    };
  }

  function update() {
    if (state.gameOver && mode.getMode() !== mode.MODES.GAMEOVER) {
      mode.setGameOver();
    }
    if (mode.getMode() === mode.MODES.GAMEOVER) {
      finalizeGameOver();
      return;
    }
    if (mode.getMode() !== mode.MODES.GAMEPLAY) {
      return;
    }
    const deltaMs = engine.timing.lastDelta;
    updateBackgroundStars(deltaMs);
    updateCosmometer(state, deltaMs);
    const prevMultiplier = state.gameMultiplier;
    updateCosmometerMultiplier(state, engine.timing.timestamp);
    updateGunBonus(state, getGlassRect);
    updateSpawn(state, getSpawnPoint, getGlassRect, deltaMs);
    updateTutorial(state, getGlassRect);
    updateKillLine(state, getGlassRect, deltaMs);
    updateBubbles(state, deltaMs, getGlassRect);
    updateBubblePopParticles(state, deltaMs);
    updateBubblePopIcons(state);
    updateGunMarks(state);
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
      spawnScoreParticles(
        state,
        render,
        removedComponentBodies,
        breakdown
      );
      const { leveledUp, prevToNextLevel } = applyLevelProgress(
        state,
        removedCount
      );
      if (leveledUp) {
        applyLevelUpReward(state, prevToNextLevel);
        spawnLevelUpPopup(state, getGlassRect, state.level);
        playSfx("level_up");
        trackLevelUp({ runId: state.runId, level: state.level });
      }
    }
    updatePreview(state, engine.timing.timestamp);
    updateRewardFloaters(state, render, getGlassRect);
    updateScoreParticles(state, render, getGlassRect);
    updateComboPopups(state);
    updateLevelUpPopups(state);

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
    mode.togglePause,
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

  function start({ source } = {}) {
    if (state.gameOverMenuTimer) {
      window.clearTimeout(state.gameOverMenuTimer);
      state.gameOverMenuTimer = 0;
    }
    beginRun(source || "play");
    mode.startGame();
    preloadAudio();
    playMusic("bgm_main_loop");
    resetTutorialForRun(state);
    state.spawnBlockResumeAt = 0;
    spawnBlock(state, getSpawnPoint);
  }

  function resumeAfterContinue() {
    if (state.gameOverMenuTimer) {
      window.clearTimeout(state.gameOverMenuTimer);
      state.gameOverMenuTimer = 0;
    }
    rollbackGameOverCoins();
    state.gameOver = false;
    state.gameOverHandled = false;
    state.paused = false;
    state.spawnBlockResumeAt = 0;
    mode.startGame();
    if (!state.waitingBody) {
      spawnBlock(state, getSpawnPoint);
    }
  }

  function restartSession({ source } = {}) {
    if (state.gameOverMenuTimer) {
      window.clearTimeout(state.gameOverMenuTimer);
      state.gameOverMenuTimer = 0;
    }
    endRun("restart");
    clearDynamicBodies();
    const fresh = createGameState();
    const preserved = {
      engine: state.engine,
      world: state.world,
      render: state.render,
      viewScale: state.viewScale,
      viewWidth: state.viewWidth,
      viewHeight: state.viewHeight,
      coins: state.coins,
      bonusInventory: state.bonusInventory,
    };
    Object.assign(state, fresh, preserved);
    applyShopToGameState(state);
    beginRun(source || "restart");
    mode.startGame();
    preloadAudio();
    playMusic("bgm_main_loop");
    resetTutorialForRun(state);
    state.spawnBlockResumeAt = 0;
    spawnBlock(state, getSpawnPoint);
  }

  function clearDynamicBodies() {
    const bodies = Matter.Composite.allBodies(world);
    for (const body of bodies) {
      if (body.parent !== body) {
        continue;
      }
      if (body.plugin?.isGlass) {
        continue;
      }
      Matter.World.remove(world, body);
    }
  }

  function applyShopState(payload) {
    if (payload?.progress) {
      applyShopToGameState(state, payload.progress);
    }
    if (Number.isFinite(payload?.coins)) {
      state.coins = payload.coins;
    }
    if (payload?.inventory) {
      state.bonusInventory = {
        ...state.bonusInventory,
        ...payload.inventory,
      };
    }
  }

  function finalizeGameOver() {
    endRun("game_over");
    if (state.gameOverHandled) {
      return;
    }
    const prevCoins = loadCoins();
    state.lastGameOverStoredCoins = prevCoins;
    state.lastGameOverCoins = Math.max(0, Math.floor(state.coins - prevCoins));
    saveCoins(state.coins);
    saveBonusInventory(state.bonusInventory);
    const prevBest = loadBestScore();
    if (state.score > prevBest) {
      saveBestScore(state.score);
      submitLeaderboardScore(state.score);
      if (typeof window !== "undefined" && window.__setBestScore) {
        window.__setBestScore(state.score);
      }
    }
    queueCloudSave(buildCloudPayload());
    state.gameOverHandled = true;
  }

  function rollbackGameOverCoins() {
    if (!state.gameOverHandled || state.lastGameOverCoins <= 0) {
      return;
    }
    const restored = Math.max(0, Math.floor(state.lastGameOverStoredCoins || 0));
    if (state.coins !== restored) {
      state.coins = restored;
      saveCoins(state.coins);
    }
    state.lastGameOverCoins = 0;
  }

  function beginRun(source) {
    state.runId = createRunId();
    state.runStartMs = Date.now();
    state.runEnded = false;
    state.totalDrops = 0;
    trackRunStart({ runId: state.runId, source });
  }

  function endRun(reason) {
    if (!state.runId || state.runEnded) {
      return;
    }
    state.runEnded = true;
    const durationMs = Date.now() - (state.runStartMs || Date.now());
    trackRunEnd({
      runId: state.runId,
      reason,
      durationMs,
      level: state.level,
      score: state.score,
      totalDrops: state.totalDrops,
    });
  }

  return {
    state,
    start,
    onResize,
    detachControls,
    setViewScale,
    setViewSize,
    setPaused: mode.setPaused,
    resumeIfAuto: mode.resumeIfAuto,
    tickAutoResume: mode.tickAutoResume,
    getPauseInfo: mode.getPauseInfo,
    setGameOver: () => {
      mode.setGameOver();
      finalizeGameOver();
    },
    openShell: () => {
      endRun("leave");
      mode.openShell();
    },
    startGame: mode.startGame,
    getMode: mode.getMode,
    applyShopState,
    resumeAfterContinue,
    restartSession,
    state,
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
  playSfx("impact_first");
}
