import { VFX_TEXT_SCALE_MAX, VFX_TEXT_SCALE_MIN } from "../config.js";

const { Body } = Matter;

export function clampWaitingBody(body, getGlassRect, glassWidth, wallThickness) {
  if (!body) {
    return;
  }
  const { left } = getGlassRect();
  const minX = left;
  const maxX = left + glassWidth;
  const { min, max } = body.bounds;
  if (min.x < minX) {
    Body.translate(body, { x: minX - min.x, y: 0 });
  } else if (max.x > maxX) {
    Body.translate(body, { x: maxX - max.x, y: 0 });
  }
}

export function setBodyScale(body, scale) {
  if (!body) {
    return;
  }
  const current = body.plugin?.scaleCurrent || 1;
  const factor = scale / current;
  Body.scale(body, factor, factor);
  body.plugin = { ...(body.plugin || {}), scaleCurrent: scale };
}

export function setBodyFillAlpha(body, alpha) {
  if (!body) {
    return;
  }
  const color = body.plugin?.color;
  const fill = color ? hexToRgba(color, alpha) : "rgba(0, 0, 0, 0)";
  const parts = body.parts.length > 1 ? body.parts : [body];
  for (const part of parts) {
    part.render.fillStyle = fill;
  }
}

export function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getVfxTextScale(state) {
  const raw = state?.viewScale ?? 1;
  const min = VFX_TEXT_SCALE_MIN ?? 0.5;
  const max = VFX_TEXT_SCALE_MAX ?? 1;
  return Math.max(min, Math.min(max, raw));
}
