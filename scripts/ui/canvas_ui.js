import { SPAWN_OFFSET } from "../config.js";
import {
  drawBottomProgress,
  drawCosmometer,
  drawTopHud,
} from "../game/lines/hud.js";
import { drawTouchOverlay } from "../game/draw/overlays.js";
import { drawPauseOverlay } from "../game/lines/overlays.js";
import { drawShellUi, isGameScreenActive } from "./canvas_shell.js";

export function drawCanvasUiWorld({ ctx, state, render, getGlassRect }) {
  const { left, top } = getGlassRect();
  const spawnY = top + SPAWN_OFFSET;
  if (state.gameOver) {
    ctx.fillStyle = "#f55a5a";
    ctx.font = "20px \"RussoOne\", sans-serif";
    ctx.fillText("GAME OVER", left + 10, top + 30);
  }
  drawCosmometer(state, ctx, getGlassRect);
  drawBottomProgress(state, ctx, getGlassRect);
  drawTouchOverlay(state, ctx, getGlassRect, spawnY);
}

export function drawCanvasUiScreen({ ctx, state, render, getGlassRect }) {
  drawShellUi(ctx, render);
  if (isGameScreenActive()) {
    drawTopHud(state, ctx, render, getGlassRect);
  }
  drawPauseOverlay(state, ctx, render);
}
