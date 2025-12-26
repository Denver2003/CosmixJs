import { GLASS_WIDTH } from "../../config.js";

export function drawTouchOverlay(state, ctx, getGlassRect, spawnY) {
  const now = state.engine.timing.timestamp;
  if (!state.bonusTouchActiveUntil || now >= state.bonusTouchActiveUntil) {
    return;
  }
  const glassRect = getGlassRect();
  const centerX = glassRect.left + GLASS_WIDTH / 2;
  const boxWidth = Math.min(260, GLASS_WIDTH * 0.9);
  const boxHeight = 54;
  const boxX = centerX - boxWidth / 2;
  const boxY = spawnY - boxHeight / 2;
  const remaining = Math.max(0, state.bonusTouchActiveUntil - now);
  const seconds = Math.ceil(remaining / 1000);

  ctx.save();
  ctx.fillStyle = "rgba(15, 17, 21, 0.75)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

  ctx.fillStyle = "#ffffff";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TOUCH TO KILL", centerX, boxY + 18);
  ctx.font = "11px sans-serif";
  ctx.fillText("TAP FIGURES TO DESTROY", centerX, boxY + 34);
  ctx.font = "11px sans-serif";
  ctx.fillText(`ENDS IN ${seconds}s`, centerX, boxY + 48);
  ctx.restore();
}
