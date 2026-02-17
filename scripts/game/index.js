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
import { setAppState } from "../shell/app_state.js";

const { Events } = Matter;

function getBgmTrackByLevel(level) {
  if (level <= 4) {
    return "bgm_loop_1";
  }
  if (level <= 8) {
    return "bgm_loop_2";
  }
  if (level <= 12) {
    return "bgm_loop_3";
  }
  return "bgm_loop_4";
}

export function createGame({ engine, world, render, runner, getGlassRect }) {
  const state = createGameState();
  state.engine = engine;
  state.world = world;
  state.render = render;
  state.spawnBlockResumeAt = 0;
  let lastSyncedCoins = null;
  const mode = createGameStateMachine(state, runner);
  mode.openShell();

  function syncCoinsToAppState() {
    const coins = Math.max(0, Math.floor(state.coins || 0));
    if (lastSyncedCoins === coins) {
      return;
    }
    lastSyncedCoins = coins;
    setAppState({ coins });
  }

  function getSpawnPoint() {
    const { left, top } = getGlassRect();
    return {
      x: left + GLASS_WIDTH / 2,
      y: top + SPAWN_OFFSET,
    };
  }

  function update() {
    syncCoinsToAppState();
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
    updateBackgroundStars(deltaMs, state.level);
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
        playMusic(getBgmTrackByLevel(state.level), { deferUntilLoopEnd: true });
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

  function start() {
    if (state.gameOverMenuTimer) {
      window.clearTimeout(state.gameOverMenuTimer);
      state.gameOverMenuTimer = 0;
    }
    mode.startGame();
    preloadAudio();
    playMusic("bgm_loop_1");
    resetTutorialForRun(state);
    state.spawnBlockResumeAt = 0;
    spawnBlock(state, getSpawnPoint);
  }

  function resumeAfterContinue() {
    if (state.gameOverMenuTimer) {
      window.clearTimeout(state.gameOverMenuTimer);
      state.gameOverMenuTimer = 0;
    }
    state.gameOver = false;
    state.gameOverHandled = false;
    state.paused = false;
    state.spawnBlockResumeAt = 0;
    mode.startGame();
    if (!state.waitingBody) {
      spawnBlock(state, getSpawnPoint);
    }
  }

  function restartSession() {
    if (state.gameOverMenuTimer) {
      window.clearTimeout(state.gameOverMenuTimer);
      state.gameOverMenuTimer = 0;
    }
    // Restart commits current run economy so reload keeps the latest balance.
    saveCoins(state.coins);
    saveBonusInventory(state.bonusInventory);
    queueCloudSave(buildCloudPayload());
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
    mode.startGame();
    preloadAudio();
    playMusic("bgm_loop_1", { restartFromStart: true });
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
      syncCoinsToAppState();
    }
    if (payload?.inventory) {
      state.bonusInventory = {
        ...state.bonusInventory,
        ...payload.inventory,
      };
    }
  }

  function finalizeGameOver() {
    if (state.gameOverHandled) {
      return;
    }
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
    openShell: mode.openShell,
    startGame: mode.startGame,
    getMode: mode.getMode,
    applyShopState,
    resumeAfterContinue,
    restartSession,
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
