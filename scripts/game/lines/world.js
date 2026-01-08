import { SHAPE_SPRITE_SCALE } from "../../config.js";
import { getSpawnWaitMs } from "../state.js";
import { getShapeSprite } from "../shape_sprites.js";
import { hexToRgba } from "../utils.js";

const { Composite } = Matter;
const OUTLINE_FALLBACK_COLOR = "#ffffff";

function isSpriteReady(sprite) {
  return sprite && !sprite._broken && sprite.complete && sprite.naturalWidth > 0;
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
    const outlineSprite = shapeType ? getShapeSprite(shapeType, "outline") : null;
    const detailsSprite = shapeType ? getShapeSprite(shapeType, "details") : null;
    const outlineReady = isSpriteReady(outlineSprite);
    const detailsReady = isSpriteReady(detailsSprite);
    if ((!outlineEdges && !outlineSprite) || !color) {
      continue;
    }
    const scale = body.plugin?.scaleCurrent || 1;
    const outlineAlpha =
      body.plugin?.preview ? body.plugin?.previewAlpha ?? 0.4 : 1;
    const stroke = hexToRgba(color, outlineAlpha);
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

    if (outlineReady) {
      if (!body.plugin.spriteReady) {
        const parts = body.parts.length > 1 ? body.parts : [body];
        for (const part of parts) {
          part.render.strokeStyle = "rgba(0, 0, 0, 0)";
        }
      }
      body.plugin = { ...(body.plugin || {}), spriteReady: true };
      const drawWidth = outlineSprite.width / SHAPE_SPRITE_SCALE;
      const drawHeight = outlineSprite.height / SHAPE_SPRITE_SCALE;
      const jitter = body.plugin?.chainBlink ? 1 : 0;
      const jitterX = body.plugin?.chainBlink ? (Math.random() < 0.5 ? -jitter : jitter) : 0;
      const jitterY = body.plugin?.chainBlink ? (Math.random() < 0.5 ? -jitter : jitter) : 0;
      ctx.save();
      ctx.globalAlpha = outlineAlpha;
      ctx.drawImage(
        outlineSprite,
        -drawWidth / 2 + jitterX,
        -drawHeight / 2 + jitterY,
        drawWidth,
        drawHeight
      );
      ctx.restore();
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
      ctx.strokeStyle = hexToRgba(OUTLINE_FALLBACK_COLOR, outlineAlpha);
      ctx.stroke();
    }

    if (detailsReady) {
      const drawWidth = detailsSprite.width / SHAPE_SPRITE_SCALE;
      const drawHeight = detailsSprite.height / SHAPE_SPRITE_SCALE;
      ctx.drawImage(
        detailsSprite,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
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
