import {
  PREVIEW_DELAY_MS,
  PREVIEW_FADE_MS,
  SPAWN_START_OFFSET,
} from "../config.js";
import { createShape } from "../shapes.js";
import { hexToRgba, setBodyScale } from "./utils.js";

const { World, Body } = Matter;

export function setPreview(state, spec, getSpawnPoint) {
  if (state.previewBody) {
    World.remove(state.world, state.previewBody);
    state.previewBody = null;
  }
  const spawn = getSpawnPoint();
  const previewPoint = { x: spawn.x, y: spawn.y - SPAWN_START_OFFSET };
  const previewBody = createShape(spec, previewPoint, { alpha: 0 });
  previewBody.isSensor = true;
  previewBody.isStatic = true;
  previewBody.collisionFilter = { group: -1, category: 0x0002, mask: 0 };
  setBodyScale(previewBody, 0.5);
  previewBody.plugin = {
    ...(previewBody.plugin || {}),
    preview: true,
    previewAlpha: 0,
  };
  state.previewStartMs = state.engine.timing.timestamp;
  state.previewBody = previewBody;
  World.add(state.world, previewBody);
}

export function updatePreview(state, timestamp) {
  if (!state.previewBody) {
    return;
  }
  const rawElapsed = timestamp - state.previewStartMs - PREVIEW_DELAY_MS;
  const elapsed = Math.min(1, Math.max(0, rawElapsed / PREVIEW_FADE_MS));
  const color = state.previewBody.plugin?.color;
  const alpha = 0.4 * elapsed;
  const stroke = color ? hexToRgba(color, alpha) : "rgba(0,0,0,0)";
  const parts =
    state.previewBody.parts.length > 1
      ? state.previewBody.parts
      : [state.previewBody];
  for (const part of parts) {
    part.render.strokeStyle = stroke;
    part.render.fillStyle = "rgba(0, 0, 0, 0)";
  }
}

export function removePreview(state) {
  if (!state.previewBody) {
    return;
  }
  World.remove(state.world, state.previewBody);
  state.previewBody = null;
  state.previewStartMs = 0;
}

export function repositionPreview(state, getSpawnPoint) {
  if (!state.previewBody) {
    return;
  }
  const spawn = getSpawnPoint();
  Body.setPosition(state.previewBody, {
    x: spawn.x,
    y: spawn.y - SPAWN_START_OFFSET,
  });
}
