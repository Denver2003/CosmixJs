import { CONTROL_DESCENT_FACTOR, GLASS_WIDTH, WALL_THICKNESS } from "../config.js";
import { dropActiveBody } from "./spawn.js";
import { clampWaitingBody } from "./utils.js";

export function attachControls(state, getSpawnPoint, getGlassRect, togglePause) {
  let pointerActive = false;
  let lastX = 0;

  function onKeyDown(event) {
    if (event.key === "p" || event.key === "P") {
      togglePause?.();
      event.preventDefault();
      return;
    }
    if (!state.waitingBody || state.gameOver) {
      return;
    }
    if (state.paused) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        state.moveLeft = true;
        break;
      case "ArrowRight":
        state.moveRight = true;
        break;
      case "ArrowDown":
        dropActiveBody(state, getSpawnPoint);
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.key) {
      case "ArrowLeft":
        state.moveLeft = false;
        break;
      case "ArrowRight":
        state.moveRight = false;
        break;
      default:
        break;
    }
  }

  function onPointerDown(event) {
    if (!state.waitingBody || state.gameOver) {
      return;
    }
    if (state.paused) {
      return;
    }
    pointerActive = true;
    lastX = event.clientX;
    state.moveLeft = false;
    state.moveRight = false;
    event.target.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!pointerActive || !state.waitingBody) {
      return;
    }
    if (state.paused) {
      return;
    }
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    if (Math.abs(dx) > 0) {
      const factor = state.waitingState === "descending" ? CONTROL_DESCENT_FACTOR : 1;
      const scale = state.viewScale || 1;
      Matter.Body.translate(state.waitingBody, { x: (dx / scale) * factor, y: 0 });
      clampWaitingBody(
        state.waitingBody,
        getGlassRect,
        GLASS_WIDTH,
        WALL_THICKNESS
      );
    }
    event.preventDefault();
  }

  function onPointerUp(event) {
    if (!pointerActive) {
      return;
    }
    if (state.paused) {
      pointerActive = false;
      return;
    }
    pointerActive = false;
    event.target.releasePointerCapture?.(event.pointerId);
    dropActiveBody(state, getSpawnPoint);
    event.preventDefault();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  };
}
