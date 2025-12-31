import { WALL_THICKNESS } from "../config.js";
import { getGlassFrame, getScreenSafeAreaPx } from "./layout.js";

export function getTopHudLayout(state, render, getGlassRect) {
  const safe = getScreenSafeAreaPx(render);
  const scale = state.viewScale || 1;
  const padding = 4 * scale;
  const topY = padding + 30 * scale;
  const glassFrame = getGlassFrame(getGlassRect());
  const glassLeft = glassFrame.x * scale;
  const glassRight = (glassFrame.x + glassFrame.width) * scale;
  const leftX = glassLeft + padding;
  const rightX = glassRight - padding;

  const labelY = topY + 8;
  const valueY = topY + 28;
  const coinsGap = 10 * scale;
  const pauseSize = 34 * scale;
  const pauseOffsetX = (WALL_THICKNESS / 2) * scale;
  const pauseOffsetY = -6 * scale;
  const pauseX = rightX - pauseSize + pauseOffsetX;
  const pauseY = Math.max(safe.y, topY + pauseOffsetY);
  const pauseCenterX = pauseX + pauseSize / 2;
  const pauseCenterY = pauseY + pauseSize / 2;

  return {
    leftX,
    rightX,
    labelY,
    valueY: pauseCenterY,
    coinsGap,
    pause: {
      x: pauseX,
      y: pauseY,
      size: pauseSize,
      centerX: pauseCenterX,
      centerY: pauseCenterY,
      radius: pauseSize / 2,
    },
  };
}
