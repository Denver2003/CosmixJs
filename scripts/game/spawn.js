import {
  CONTROL_DESCENT_FACTOR,
  CONTROL_SPEED,
  DROP_SPEED,
  GLASS_WIDTH,
  SPAWN_OFFSET,
  SPAWN_START_OFFSET,
  WALL_THICKNESS,
} from "../config.js";
import { createRandomSpec, createShape } from "../shapes.js";
import { getSpawnWaitMs } from "./state.js";
import { clampWaitingBody, setBodyScale } from "./utils.js";
import { removePreview, setPreview } from "./preview.js";

const { Body, World } = Matter;

export function spawnBlock(state, getSpawnPoint) {
  if (state.gameOver) {
    return;
  }
  const spawn = getSpawnPoint();
  const spawnY = spawn.y - SPAWN_START_OFFSET;
  const spawnPoint = { x: spawn.x, y: spawnY };
  const body = createShape(state.nextSpec, spawnPoint);
  body.plugin = { ...(body.plugin || {}), stopAtSpawn: true };
  setBodyScale(body, 0.5);
  body.plugin.scaleTarget = 1;
  body.plugin.scaleStartY = spawnY;
  body.plugin.scaleEndY = spawn.y;
  state.waitingBody = body;
  state.waitingState = "descending";
  World.add(state.world, body);
  state.nextSpec = createRandomSpec(state.colorsCount, state.rotationRange);
  setPreview(state, state.nextSpec, getSpawnPoint);
}

export function dropActiveBody(state, getSpawnPoint) {
  if (!state.waitingBody || state.gameOver) {
    return;
  }

  setBodyScale(state.waitingBody, 1);
  removePreview(state);
  state.waitingBody.plugin.stopAtSpawn = false;
  Body.setStatic(state.waitingBody, false);
  Body.setVelocity(state.waitingBody, {
    x: state.waitingBody.velocity.x,
    y: DROP_SPEED,
  });
  state.waitingBody.plugin = {
    ...(state.waitingBody.plugin || {}),
    impactArmed: true,
  };
  state.waitingBody = null;
  state.waitingState = "none";
  state.waitStartMs = 0;
  spawnBlock(state, getSpawnPoint);
}

export function updateSpawn(state, getSpawnPoint, getGlassRect, deltaMs) {
  if (!state.waitingBody) {
    return;
  }

  const spawnPoint = getSpawnPoint();
  if (
    state.waitingState === "descending" &&
    state.waitingBody.plugin?.stopAtSpawn &&
    state.waitingBody.position.y >= spawnPoint.y
  ) {
    setBodyScale(state.waitingBody, 1);
    Body.setPosition(state.waitingBody, {
      x: state.waitingBody.position.x,
      y: spawnPoint.y,
    });
    Body.setVelocity(state.waitingBody, { x: 0, y: 0 });
    Body.setAngularVelocity(state.waitingBody, 0);
    Body.setStatic(state.waitingBody, true);
    state.waitingState = "armed";
    state.waitStartMs = state.engine.timing.timestamp;
  }

  if (
    state.waitingState === "armed" &&
    state.engine.timing.timestamp - state.waitStartMs >= getSpawnWaitMs(state.level)
  ) {
    dropActiveBody(state, getSpawnPoint);
  }

  if (state.waitingState === "armed" || state.waitingState === "descending") {
    const direction = (state.moveRight ? 1 : 0) - (state.moveLeft ? 1 : 0);
    if (direction !== 0) {
      const deltaSeconds = deltaMs / 1000;
      const speed =
        state.waitingState === "descending"
          ? CONTROL_SPEED * CONTROL_DESCENT_FACTOR
          : CONTROL_SPEED;
      Body.translate(state.waitingBody, {
        x: direction * speed * deltaSeconds,
        y: 0,
      });
      clampWaitingBody(
        state.waitingBody,
        getGlassRect,
        GLASS_WIDTH,
        WALL_THICKNESS
      );
    }
  }

  if (state.waitingState === "descending") {
    const t = Math.max(
      0,
      Math.min(
        1,
        (state.waitingBody.position.y - state.waitingBody.plugin.scaleStartY) /
          (state.waitingBody.plugin.scaleEndY - state.waitingBody.plugin.scaleStartY)
      )
    );
    const desiredScale = 0.5 + 0.5 * t;
    if (Math.abs(desiredScale - (state.waitingBody.plugin.scaleCurrent || 1)) > 0.001) {
      setBodyScale(state.waitingBody, desiredScale);
    }
  }
}

export function repositionWaiting(state, getSpawnPoint, getGlassRect) {
  if (!state.waitingBody || state.waitingState !== "armed") {
    return;
  }
  const spawn = getSpawnPoint();
  Body.setPosition(state.waitingBody, {
    x: state.waitingBody.position.x,
    y: spawn.y,
  });
  clampWaitingBody(
    state.waitingBody,
    getGlassRect,
    GLASS_WIDTH,
    WALL_THICKNESS
  );
}
