import { createGameState } from "./state.js";
import { attachControls } from "./controls.js";
import { drawLines } from "./lines.js";
import { updateChains } from "./chains.js";
import { updateKillLine } from "./kill.js";
import { updatePreview, repositionPreview } from "./preview.js";
import { spawnBlock, updateSpawn, repositionWaiting } from "./spawn.js";
import { GLASS_WIDTH, SPAWN_OFFSET } from "../config.js";

const { Events } = Matter;

export function createGame({ engine, world, render, getGlassRect }) {
  const state = createGameState();
  state.engine = engine;
  state.world = world;

  function getSpawnPoint() {
    const { left, top } = getGlassRect();
    return {
      x: left + GLASS_WIDTH / 2,
      y: top + SPAWN_OFFSET,
    };
  }

  function update() {
    if (state.gameOver) {
      return;
    }
    const deltaMs = engine.timing.lastDelta;
    updateSpawn(state, getSpawnPoint, getGlassRect, deltaMs);
    updateKillLine(state, getGlassRect, deltaMs);
    updateChains(state, deltaMs);
    updatePreview(state, engine.timing.timestamp);
  }

  function draw() {
    drawLines(state, render, getGlassRect);
  }

  Events.on(engine, "afterUpdate", update);
  Events.on(render, "afterRender", draw);

  const detachControls = attachControls(state, getSpawnPoint);

  function onResize() {
    repositionWaiting(state, getSpawnPoint, getGlassRect);
    repositionPreview(state, getSpawnPoint);
  }

  function start() {
    spawnBlock(state, getSpawnPoint);
  }

  return { start, onResize, detachControls };
}
