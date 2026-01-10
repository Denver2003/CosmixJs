import { KILL_DURATION_MS, KILL_OFFSET } from "../config.js";
import { playSfx, setLoop } from "../audio/index.js";

const { Composite } = Matter;

export function updateKillLine(state, getGlassRect, deltaMs) {
  const { top } = getGlassRect();
  const killY = top + KILL_OFFSET;
  if (state.killGraceUntil && state.engine?.timing?.timestamp < state.killGraceUntil) {
    state.killTouchMs = 0;
    return;
  }
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

  if (touchingKill && !state.killWarningActive) {
    state.killWarningActive = true;
    setLoop("laser_warning_loop", true);
  } else if (!touchingKill && state.killWarningActive) {
    state.killWarningActive = false;
    setLoop("laser_warning_loop", false);
  }

  if (state.killTouchMs >= KILL_DURATION_MS) {
    setLoop("laser_warning_loop", false);
    playSfx("laser_timeout_hit");
    if (typeof window !== "undefined" && window.__setGameOver) {
      window.__setGameOver();
    } else {
      state.gameOver = true;
    }
    if (state.waitingBody) {
      Matter.World.remove(state.world, state.waitingBody);
    }
    state.waitingBody = null;
    state.waitingState = "none";
    state.moveLeft = false;
    state.moveRight = false;
    state.bubbles = [];
  }
}
