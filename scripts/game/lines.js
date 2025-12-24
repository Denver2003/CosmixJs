import {
  DEBUG_OVERLAY,
  GLASS_WIDTH,
  KILL_OFFSET,
  SPAWN_OFFSET,
} from "../config.js";
import { hexToRgba } from "./utils.js";

export function drawLines(state, render, getGlassRect) {
  const { left, top } = getGlassRect();
  const spawnY = top + SPAWN_OFFSET;
  const killY = top + KILL_OFFSET;

  const ctx = render.context;
  ctx.save();
  ctx.strokeStyle = "#3fa9f5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, spawnY);
  ctx.lineTo(left + GLASS_WIDTH, spawnY);
  ctx.stroke();

  const killPhaseMs = state.killTouchMs;
  let alpha = 0.25;
  if (killPhaseMs >= 2000 && killPhaseMs < 6000) {
    const phase = state.engine.timing.timestamp / 1000;
    alpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
  } else if (killPhaseMs >= 6000) {
    const phase = state.engine.timing.timestamp / 250;
    alpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
  }
  ctx.strokeStyle = hexToRgba("#f55a5a", alpha);
  ctx.beginPath();
  ctx.moveTo(left, killY);
  ctx.lineTo(left + GLASS_WIDTH, killY);
  ctx.stroke();

  if (state.gameOver) {
    ctx.fillStyle = "#f55a5a";
    ctx.font = "20px sans-serif";
    ctx.fillText("GAME OVER", left + 10, top + 30);
  }

  if (DEBUG_OVERLAY) {
    const right = left + GLASS_WIDTH;
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`LVL ${state.level}`, right - 6, top + 14);
    ctx.fillText(
      `CLEARED ${state.clearedThisLevel}/${state.toNextLevel}`,
      right - 6,
      top + 28
    );
    const angleDeg = Math.round((state.rotationRange * 180) / Math.PI);
    ctx.fillText(`ANGLE ${angleDeg}°`, right - 6, top + 42);
    ctx.fillText(`COLORS ${state.colorsCount}`, right - 6, top + 56);
    ctx.textAlign = "start";
  }
  ctx.restore();
}
