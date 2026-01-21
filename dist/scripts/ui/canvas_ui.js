import { SPAWN_OFFSET } from "../config.js";
import {
  drawBottomProgress,
  drawCosmometer,
  drawTopHud,
} from "../game/lines/hud.js";
import { drawTouchOverlay } from "../game/draw/overlays.js";
import { drawCanvasOverlays } from "./canvas_overlays.js";
import { drawShellUi, isGameScreenActive } from "./canvas_shell.js";

export function drawCanvasUiWorld({ ctx, state, render, getGlassRect }) {
  if (!isGameScreenActive()) {
    return;
  }
  const { left, top } = getGlassRect();
  const spawnY = top + SPAWN_OFFSET;
  drawCosmometer(state, ctx, getGlassRect);
  drawBottomProgress(state, ctx, getGlassRect);
  drawTouchOverlay(state, ctx, getGlassRect, spawnY);
}

export function drawCanvasUiScreen({ ctx, state, render, getGlassRect }) {
  drawShellUi(ctx, render, getGlassRect);
  if (isGameScreenActive()) {
    drawTopHud(state, ctx, render, getGlassRect);
  }
  drawCanvasOverlays({
    ctx,
    render,
    getGlassRect,
    state,
    isGameActive: isGameScreenActive(),
  });
}
