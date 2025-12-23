import { dropActiveBody } from "./spawn.js";

export function attachControls(state, getSpawnPoint) {
  function onKeyDown(event) {
    if (!state.waitingBody || state.waitingState !== "armed" || state.gameOver) {
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

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}
