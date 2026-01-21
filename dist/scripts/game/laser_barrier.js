import { hexToRgba } from "./utils.js";

const DEFAULT_COLOR = { r: 120, g: 220, b: 255 };

export function drawLaserBarrier(
  ctx,
  y,
  width,
  timeSec,
  danger,
  color = DEFAULT_COLOR,
  timerProgress = 0,
  touchMs = 0,
  overallAlpha = 1
) {
  const d = clamp01(danger);
  const alphaScale = clamp01(overallAlpha);
  const activityBoost = clamp01((touchMs - 2000) / 8000);
  const baseHeight = lerp(12, 16, d);
  const glowHeight = lerp(12, 28 + 8 * activityBoost, d);
  const coreWidth = 1.5;
  const pulse = 0.5 + 0.5 * Math.sin(timeSec * (2.4 + 1.2 * activityBoost));
  const jitter =
    touchMs >= 1000 ? (Math.random() * 2 - 1) * lerp(0.5, 1 + activityBoost, d) : 0;
  const baseAlpha = lerp(0.12, 0.25, d) * alphaScale;
  const glowAlpha = lerp(0.2, 0.6, d) * (0.6 + 0.4 * pulse) * alphaScale;
  const coreAlpha = lerp(0.6, 1, d) * (0.7 + 0.3 * pulse) * alphaScale;
  const tint = mixColor(color, { r: 160, g: 120, b: 255 }, 0.4);
  const dangerTint = mixColor(tint, { r: 255, g: 80, b: 80 }, timerProgress);

  ctx.save();
  ctx.translate(0, jitter);

  // Base band (dark strip).
  const bandY = y - baseHeight / 2;
  const bandGradient = ctx.createLinearGradient(0, bandY, 0, bandY + baseHeight);
  bandGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  bandGradient.addColorStop(0.5, `rgba(0, 0, 0, ${baseAlpha.toFixed(3)})`);
  bandGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bandGradient;
  ctx.fillRect(0, bandY, width, baseHeight);

  // Glow layer.
  const glowY = y - glowHeight / 2;
  const glowGradient = ctx.createLinearGradient(0, glowY, 0, glowY + glowHeight);
  glowGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  glowGradient.addColorStop(
    0.5,
    `rgba(${dangerTint.r}, ${dangerTint.g}, ${dangerTint.b}, ${glowAlpha.toFixed(3)})`
  );
  glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, glowY, width, glowHeight);
  ctx.restore();

  // Core line.
  ctx.strokeStyle = `rgba(255, 255, 255, ${coreAlpha.toFixed(3)})`;
  ctx.lineWidth = coreWidth;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();

  // Scan segments.
  const segmentCount = Math.round(lerp(2, 6 + 2 * activityBoost, d));
  const segmentSpeed = lerp(40, 140 + 80 * activityBoost, d);
  const segmentLength = lerp(20, 60, d);
  const segmentAlpha = lerp(0.2, 0.7, d) * alphaScale;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(${dangerTint.r}, ${dangerTint.g}, ${dangerTint.b}, ${segmentAlpha.toFixed(3)})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < segmentCount; i += 1) {
    const offset = (timeSec * segmentSpeed + i * 80) % (width + segmentLength);
    const x = offset - segmentLength;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + segmentLength, y);
    ctx.stroke();
  }
  ctx.restore();

  // Sparks (critical only).
  if (d > 0.75) {
    const sparkCount = Math.round(lerp(0, 4, (d - 0.75) / 0.25));
    for (let i = 0; i < sparkCount; i += 1) {
      const sx = Math.random() * width;
      const sy = y + (Math.random() * 2 - 1) * 3;
      const radius = 1 + Math.random();
      ctx.fillStyle = `rgba(255, 255, 255, ${(lerp(0.3, 0.8, d) * alphaScale).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function mixColor(from, to, t) {
  return {
    r: Math.round(from.r + (to.r - from.r) * t),
    g: Math.round(from.g + (to.g - from.g) * t),
    b: Math.round(from.b + (to.b - from.b) * t),
  };
}
