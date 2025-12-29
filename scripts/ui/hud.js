import { WALL_THICKNESS } from "../config.js";
import { getGlassFrame, getScreenSafeAreaPx } from "./layout.js";

export function getTopHudLayout(state, render, getGlassRect) {
  const safe = getScreenSafeAreaPx(render);
  const padding = 4;
  const topY = safe.y + padding;
  const glassFrame = getGlassFrame(getGlassRect());
  const scale = state.viewScale || 1;
  const glassLeft = glassFrame.x * scale;
  const glassRight = (glassFrame.x + glassFrame.width) * scale;
  const leftX = Math.max(safe.x + padding, glassLeft + padding);
  const rightX = Math.min(safe.x + safe.width - padding, glassRight - padding);

  const labelY = topY + 8;
  const valueY = topY + 28;
  const coinsGap = 10;
  const pauseSize = 34;
  const pauseOffsetX = (WALL_THICKNESS / 2) * scale;
  const pauseOffsetY = -6;
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
