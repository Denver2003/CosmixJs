import { KILL_DURATION_MS, KILL_OFFSET } from "../config.js";

const { Composite } = Matter;

export function updateKillLine(state, getGlassRect, deltaMs) {
  const { top } = getGlassRect();
  const killY = top + KILL_OFFSET;
  const bodies = Composite.allBodies(state.world);
  let touchingKill = false;
  for (const body of bodies) {
    if (body.isStatic) {
      continue;
    }
    if (body.plugin?.burst?.active) {
      continue;
    }
    if (state.waitingState === "armed" && body === state.waitingBody) {
      continue;
    }
    if (body.bounds.min.y <= killY && body.bounds.max.y >= killY) {
      touchingKill = true;
      break;
    }
  }

  if (touchingKill) {
    state.killTouchMs += deltaMs;
  } else {
    state.killTouchMs = 0;
  }

  if (state.killTouchMs >= KILL_DURATION_MS) {
    state.gameOver = true;
    state.waitingBody = null;
    state.waitingState = "none";
    state.moveLeft = false;
    state.moveRight = false;
    state.bubbles = [];
  }
}
