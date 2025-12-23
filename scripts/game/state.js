import { createRandomSpec } from "../shapes.js";

export function createGameState() {
  return {
    waitingBody: null,
    waitingState: "none",
    waitStartMs: 0,
    moveLeft: false,
    moveRight: false,
    gameOver: false,
    killTouchMs: 0,
    chainStates: [],
    debugLogMs: 0,
    chainGraceMs: 0,
    nextSpec: createRandomSpec(),
    previewBody: null,
    previewStartMs: 0,
  };
}
