import { hexToRgba } from "../utils.js";

export function drawPauseOverlay(state, ctx, render) {
  if (!state.paused) {
    return;
  }
  const viewWidth = render.options.width;
  const viewHeight = render.options.height;
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;
  const boxWidth = Math.min(320, viewWidth * 0.7);
  const boxHeight = 70;
  const nowMs =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  const phase = nowMs / 250;
  const alpha = 0.2 + 0.2 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));

  ctx.save();
  ctx.fillStyle = hexToRgba("#0f1115", 0.55 + alpha * 0.2);
  ctx.fillRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);
  ctx.strokeStyle = hexToRgba("#cfd8dc", 0.9);
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight);
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "14px \"RussoOne\", sans-serif";
  ctx.textAlign = "center";
  const isAuto = state.pausedReason && state.pausedReason !== "manual";
  const label = isAuto ? "PAUSED (AUTO)" : "PAUSED";
  ctx.fillText(label, centerX, centerY - 6);
  if (isAuto && state.pausedResumeMs) {
    const nowMs =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    const remaining = Math.max(0, state.pausedResumeMs - nowMs);
    const seconds = Math.ceil(remaining / 1000);
    ctx.font = "12px \"RussoOne\", sans-serif";
    ctx.fillText(`RESUMING IN ${seconds}`, centerX, centerY + 12);
  } else {
    ctx.font = "12px \"RussoOne\", sans-serif";
    ctx.fillText("PRESS P TO RESUME", centerX, centerY + 12);
  }
  ctx.restore();
}
