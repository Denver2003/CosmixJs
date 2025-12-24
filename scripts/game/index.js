import { applyLevelProgress, createGameState } from "./state.js";
import { attachControls } from "./controls.js";
import { drawLines } from "./lines.js";
import { updateChains } from "./chains.js";
import { updateKillLine } from "./kill.js";
import { updatePreview, repositionPreview } from "./preview.js";
import { spawnBlock, updateSpawn, repositionWaiting } from "./spawn.js";
import { GLASS_WIDTH, IMPACT_FLASH_DURATION_MS, SPAWN_OFFSET } from "../config.js";

const { Events } = Matter;

export function createGame({ engine, world, render, runner, getGlassRect }) {
  const state = createGameState();
  state.engine = engine;
  state.world = world;

  function getNowMs() {
    return typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  }

  function getSpawnPoint() {
    const { left, top } = getGlassRect();
    return {
      x: left + GLASS_WIDTH / 2,
      y: top + SPAWN_OFFSET,
    };
  }

  function update() {
    if (state.gameOver || state.paused) {
      return;
    }
    const deltaMs = engine.timing.lastDelta;
    updateSpawn(state, getSpawnPoint, getGlassRect, deltaMs);
    updateKillLine(state, getGlassRect, deltaMs);
    const removedCount = updateChains(state, deltaMs);
    if (removedCount) {
      console.log(
        "[level]",
        "cleared:",
        state.clearedThisLevel + removedCount,
        "/",
        state.toNextLevel
      );
      applyLevelProgress(state, removedCount);
    }
    updatePreview(state, engine.timing.timestamp);
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

  const detachControls = attachControls(state, getSpawnPoint, getGlassRect, () => {
    if (state.paused) {
      setPaused(false, "manual");
      return;
    }
    setPaused(true, "manual");
  });

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

  function setPaused(paused, reason = "manual", resumeDelayMs = 0) {
    if (paused) {
      if (state.paused && state.pausedReason === "manual" && reason !== "manual") {
        return;
      }
      state.paused = true;
      state.pausedReason = reason;
      state.pausedAtMs = getNowMs();
      state.pausedResumeMs = resumeDelayMs
        ? getNowMs() + resumeDelayMs
        : 0;
      if (runner) {
        runner.enabled = false;
      }
      return;
    }
    state.paused = false;
    state.pausedReason = null;
    state.pausedAtMs = 0;
    state.pausedResumeMs = 0;
    if (runner) {
      runner.enabled = true;
    }
  }

  function resumeIfAuto() {
    if (!state.paused || state.pausedReason === "manual") {
      return;
    }
    if (!state.pausedResumeMs) {
      return;
    }
    if (getNowMs() >= state.pausedResumeMs) {
      setPaused(false, state.pausedReason);
    }
  }

  function tickAutoResume() {
    if (!state.paused || state.pausedReason === "manual") {
      return;
    }
    if (!state.pausedResumeMs) {
      return;
    }
    if (getNowMs() >= state.pausedResumeMs) {
      setPaused(false, state.pausedReason);
    }
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
    setPaused,
    resumeIfAuto,
    tickAutoResume,
    getPauseInfo: () => ({ paused: state.paused, reason: state.pausedReason }),
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
