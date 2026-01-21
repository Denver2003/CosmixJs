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
import { addEnergyOnDrop, updateCosmometerMultiplier } from "./cosmometer.js";
import { clampWaitingBody, setBodyFillAlpha, setBodyScale } from "./utils.js";
import { playSfx } from "../audio/index.js";
import { removePreview, setPreview } from "./preview.js";
import { trySpawnBubble } from "./bubbles.js";
import { handleTutorialDrop } from "./tutorial.js";

const { Body, World } = Matter;

export function spawnBlock(state, getSpawnPoint) {
  if (state.gameOver) {
    return;
  }
  const spawn = getSpawnPoint();
  const spawnY = spawn.y - SPAWN_START_OFFSET;
  const spawnPoint = { x: spawn.x, y: spawnY };
  const body = createShape(state.nextSpec, spawnPoint);
  body.plugin = {
    ...(body.plugin || {}),
    stopAtSpawn: true,
    fillLocked: 0.3,
    fillAlpha: 0.3,
  };
  setBodyFillAlpha(body, 0.3);
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

export function dropActiveBody(state, getSpawnPoint, getGlassRect) {
  if (!state.waitingBody || state.gameOver) {
    return;
  }
  if (state.bonusTouchActiveUntil && state.engine.timing.timestamp < state.bonusTouchActiveUntil) {
    return;
  }
  addEnergyOnDrop(state);
  updateCosmometerMultiplier(state, state.engine.timing.timestamp);

  state.aimGuideBody = state.waitingBody;
  state.aimGuideFadeOutStartMs = state.engine.timing.timestamp;
  state.aimGuideFadeInStartMs = 0;

  setBodyScale(state.waitingBody, 1);
  removePreview(state);
  state.waitingBody.plugin.stopAtSpawn = false;
  state.waitingBody.plugin = {
    ...(state.waitingBody.plugin || {}),
    fillLocked: null,
  };
  Body.setStatic(state.waitingBody, false);
  Body.setVelocity(state.waitingBody, {
    x: state.waitingBody.velocity.x,
    y: DROP_SPEED,
  });
  playSfx("drop_whoosh");
  state.waitingBody.plugin = {
    ...(state.waitingBody.plugin || {}),
    impactArmed: true,
  };
  state.waitingBody = null;
  state.waitingState = "none";
  state.waitStartMs = 0;
  spawnBlock(state, getSpawnPoint);
  handleTutorialDrop(state, getGlassRect);
  if (state.bonusUpgradeLevel >= 4 && getGlassRect) {
    if (Math.random() < 0.05) {
      trySpawnBubble(state, getGlassRect, "drop");
    }
  }
}

export function updateSpawn(state, getSpawnPoint, getGlassRect, deltaMs) {
  const now = state.engine.timing.timestamp;
  if (state.spawnBlockResumeAt && now < state.spawnBlockResumeAt) {
    return;
  }
  const touchActive = state.bonusTouchActiveUntil && now < state.bonusTouchActiveUntil;
  if (!state.waitingBody) {
    if (touchActive) {
      return;
    }
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
    state.aimGuideBody = state.waitingBody;
    state.aimGuideFadeInStartMs = state.engine.timing.timestamp;
    state.aimGuideFadeOutStartMs = 0;
    state.waitingBody.plugin = {
      ...(state.waitingBody.plugin || {}),
      fillLocked: 0.45,
      fillAlpha: 0.45,
    };
    setBodyFillAlpha(state.waitingBody, 0.45);
    state.waitingState = "armed";
    state.waitStartMs = state.engine.timing.timestamp;
  }

  if (
    state.waitingState === "armed" &&
    state.engine.timing.timestamp - state.waitStartMs >= getSpawnWaitMs(state.level)
  ) {
    if (!touchActive) {
      dropActiveBody(state, getSpawnPoint, getGlassRect);
    }
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
