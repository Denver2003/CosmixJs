import { SHAPE_SPRITE_SCALE } from "../../config.js";
import { getSpawnWaitMs } from "../state.js";
import { getShapeSprite } from "../shape_sprites.js";
import { hexToRgba } from "../utils.js";

const { Composite } = Matter;
const SPRITE_TINT_CACHE = new Map();

function getTintedSprite(sprite, stroke) {
  if (!sprite || !stroke) {
    return null;
  }
  const key = `${sprite.src || "inline"}|${stroke}`;
  const cached = SPRITE_TINT_CACHE.get(key);
  if (cached && cached.width === sprite.width && cached.height === sprite.height) {
    return cached;
  }
  const canvas = document.createElement("canvas");
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = stroke;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  SPRITE_TINT_CACHE.set(key, canvas);
  return canvas;
}

export function drawCustomOutlines(state, ctx) {
  const bodies = Composite.allBodies(state.world);
  ctx.save();
  ctx.lineWidth = 2;
  for (const body of bodies) {
    const outlineEdges = body.plugin?.outlineEdges;
    const cellRects = body.plugin?.cellRects;
    const color = body.plugin?.color;
    const shapeType = body.plugin?.shapeType;
    const sprite = shapeType ? getShapeSprite(shapeType) : null;
    const spriteReady =
      sprite && !sprite._broken && sprite.complete && sprite.naturalWidth > 0;
    if ((!outlineEdges && !sprite) || !color) {
      continue;
    }
    const scale = body.plugin?.scaleCurrent || 1;
    const alpha = body.plugin?.preview ? body.plugin?.previewAlpha ?? 0.4 : null;
    const stroke = alpha === null ? color : hexToRgba(color, alpha);
    const fillAlpha = body.plugin?.fillAlpha ?? 0;
    const fill =
      fillAlpha > 0 ? hexToRgba(color, Math.min(fillAlpha, 1)) : null;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.scale(scale, scale);

    if (fill && cellRects) {
      ctx.fillStyle = fill;
      for (const rect of cellRects) {
        ctx.fillRect(rect.x, rect.y, rect.size, rect.size);
      }
    }

    if (spriteReady) {
      if (!body.plugin.spriteReady) {
        const parts = body.parts.length > 1 ? body.parts : [body];
        for (const part of parts) {
          part.render.strokeStyle = "rgba(0, 0, 0, 0)";
        }
      }
      body.plugin = { ...(body.plugin || {}), spriteReady: true };
      const tinted = getTintedSprite(sprite, stroke);
      if (tinted) {
        const drawWidth = tinted.width / SHAPE_SPRITE_SCALE;
        const drawHeight = tinted.height / SHAPE_SPRITE_SCALE;
        ctx.drawImage(tinted, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      }
    } else if (body.plugin?.spriteReady) {
      const parts = body.parts.length > 1 ? body.parts : [body];
      for (const part of parts) {
        part.render.strokeStyle = stroke;
      }
      body.plugin = { ...(body.plugin || {}), spriteReady: false };
    } else if (outlineEdges) {
      ctx.beginPath();
      for (const edge of outlineEdges) {
        ctx.moveTo(edge.x1, edge.y1);
        ctx.lineTo(edge.x2, edge.y2);
      }
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

export function drawWaitFill(state, ctx) {
  const body = state.waitingBody;
  if (!body || state.waitingState !== "armed") {
    return;
  }
  const elapsedMs = state.engine.timing.timestamp - state.waitStartMs;
  const waitMs = getSpawnWaitMs(state.level);
  const progress = Math.max(0, Math.min(1, elapsedMs / waitMs));
  const bounds = body.bounds;
  const height = bounds.max.y - bounds.min.y;
  const fillHeight = height * progress;
  const color = body.plugin?.color || "#ffffff";
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
  for (let i = 1; i < body.vertices.length; i += 1) {
    ctx.lineTo(body.vertices[i].x, body.vertices[i].y);
  }
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = hexToRgba(color, 0.25);
  ctx.fillRect(
    bounds.min.x,
    bounds.min.y,
    bounds.max.x - bounds.min.x,
    fillHeight
  );
  ctx.restore();
}
