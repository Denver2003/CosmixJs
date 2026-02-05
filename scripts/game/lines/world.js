import {
  CHAIN_HALO_ALPHA_MAX,
  CHAIN_HALO_ALPHA_MIN,
  CHAIN_HALO_BLUR_MAX,
  CHAIN_HALO_BLUR_MIN,
  CHAIN_HALO_PAD_PX,
  CHAIN_SHIMMER_ALPHA,
  CHAIN_SHIMMER_BAND_RATIO,
  CHAIN_SHIMMER_DURATION_MS,
  GLASS_HEIGHT,
  SHAPE_SPRITE_SCALE,
  WAIT_FILL_OVERLAY_ALPHA,
} from "../../config.js";
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
    const chainSize = body.plugin?.chainSize || 0;
    const chainHalo = chainSize >= 4 && body !== state.waitingBody;
    const shimmer = getChainShimmer(state, body);
    if (shimmer) {
      drawChainShimmerBandWorld(ctx, body, shimmer.progress);
    }
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
      if (body === state.waitingBody) {
        const haloPadPx = 2;
        const haloWidth =
          (outlineSprite.width + haloPadPx * 2) / SHAPE_SPRITE_SCALE;
        const haloHeight =
          (outlineSprite.height + haloPadPx * 2) / SHAPE_SPRITE_SCALE;
        ctx.save();
        const glowPulse = 0.5 + 0.5 * Math.sin(state.engine.timing.timestamp / 280);
        ctx.globalAlpha = 0.5 + 0.2 * glowPulse;
        ctx.shadowColor = "rgba(255, 255, 255, 1)";
        ctx.shadowBlur = 12 + 6 * glowPulse;
        ctx.drawImage(
          outlineSprite,
          -haloWidth / 2,
          -haloHeight / 2,
          haloWidth,
          haloHeight
        );
        ctx.drawImage(
          outlineSprite,
          -haloWidth / 2,
          -haloHeight / 2,
          haloWidth,
          haloHeight
        );
        ctx.restore();
      }
      if (chainHalo) {
        const haloWidth =
          (outlineSprite.width + CHAIN_HALO_PAD_PX * 2) / SHAPE_SPRITE_SCALE;
        const haloHeight =
          (outlineSprite.height + CHAIN_HALO_PAD_PX * 2) / SHAPE_SPRITE_SCALE;
        const haloPulse = 0.5 + 0.5 * Math.sin(state.engine.timing.timestamp / 220);
        const haloAlpha =
          CHAIN_HALO_ALPHA_MIN +
          (CHAIN_HALO_ALPHA_MAX - CHAIN_HALO_ALPHA_MIN) * haloPulse;
        const haloBlur =
          CHAIN_HALO_BLUR_MIN +
          (CHAIN_HALO_BLUR_MAX - CHAIN_HALO_BLUR_MIN) * haloPulse;
        ctx.save();
        ctx.globalAlpha = haloAlpha;
        ctx.shadowColor = "rgba(255, 255, 255, 1)";
        ctx.shadowBlur = haloBlur;
        ctx.drawImage(
          outlineSprite,
          -haloWidth / 2,
          -haloHeight / 2,
          haloWidth,
          haloHeight
        );
        ctx.drawImage(
          outlineSprite,
          -haloWidth / 2,
          -haloHeight / 2,
          haloWidth,
          haloHeight
        );
        ctx.restore();
      }
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
      const outlineBoostAlpha = chainHalo
        ? Math.max(outlineAlpha, CHAIN_HALO_ALPHA_MAX)
        : outlineAlpha;
      const outlineWidth = chainHalo ? 3 : 2;
      ctx.beginPath();
      for (const edge of outlineEdges) {
        ctx.moveTo(edge.x1, edge.y1);
        ctx.lineTo(edge.x2, edge.y2);
      }
      ctx.lineWidth = outlineWidth;
      ctx.strokeStyle = hexToRgba(OUTLINE_FALLBACK_COLOR, outlineBoostAlpha);
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

export function drawAimGuides(state, ctx, getGlassRect) {
  const body = state.waitingBody || state.aimGuideBody;
  if (!body || !getGlassRect) {
    return;
  }
  const now = state.engine.timing.timestamp;
  let alphaScale = 0;
  if (state.waitingBody && state.waitingState === "armed") {
    const elapsed = now - (state.aimGuideFadeInStartMs || now);
    alphaScale = Math.max(0, Math.min(1, elapsed / 200));
  } else if (!state.waitingBody && state.aimGuideBody && state.aimGuideFadeOutStartMs) {
    const elapsed = now - state.aimGuideFadeOutStartMs;
    alphaScale = Math.max(0, 1 - Math.min(1, elapsed / 200));
    if (alphaScale <= 0.001) {
      state.aimGuideBody = null;
      state.aimGuideFadeOutStartMs = 0;
    }
  } else {
    return;
  }
  const bounds = body.bounds;
  const glass = getGlassRect();
  const bottomY = bounds.max.y;
  const leftX = bounds.min.x;
  const rightX = bounds.max.x;
  const leftEndY = getGuideEndY(state, glass, body, bottomY, leftX);
  const rightEndY = getGuideEndY(state, glass, body, bottomY, rightX);
  if (leftEndY <= bottomY && rightEndY <= bottomY) {
    return;
  }
  const color = body.plugin?.color || "#ffffff";
  const glowPulse = 0.5 + 0.5 * Math.sin(state.engine.timing.timestamp / 280);
  const baseAlpha = 0.4 * (0.6 + 0.4 * glowPulse) * alphaScale;
  const minGuideAlpha = 0.18 * alphaScale;

  const getContactY = (targetX) => {
    const epsilon = 0.5;
    let sum = 0;
    let count = 0;
    for (const v of body.vertices) {
      if (Math.abs(v.x - targetX) <= epsilon) {
        sum += v.y;
        count += 1;
      }
    }
    if (count > 0) {
      return sum / count;
    }
    return bottomY;
  };

  const drawGuide = (x, touchY, endY, width, alphaScale, blur = 0) => {
    const startY = touchY;
    const gradient = ctx.createLinearGradient(0, startY, 0, endY);
    const denom = Math.max(1, endY - startY);
    const peakT = Math.max(0, Math.min(1, (bottomY - startY) / denom));
    gradient.addColorStop(0, hexToRgba(color, 0));
    gradient.addColorStop(
      peakT,
      hexToRgba(color, Math.max(minGuideAlpha, baseAlpha * alphaScale))
    );
    gradient.addColorStop(1, hexToRgba(color, 0));
    ctx.save();
    ctx.strokeStyle = hexToRgba(color, Math.max(minGuideAlpha * 0.7, 0.08));
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = width;
    if (blur > 0) {
      ctx.shadowColor = hexToRgba(color, baseAlpha * 0.6);
      ctx.shadowBlur = blur;
    }
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
    ctx.restore();
  };

  const leftTouchY = getContactY(leftX);
  const rightTouchY = getContactY(rightX);
  if (leftEndY > bottomY) {
    drawGuide(leftX, leftTouchY, leftEndY, 1, 1, 0);
    drawGuide(leftX, leftTouchY, leftEndY, 2, 0.35, 6);
  }
  if (rightEndY > bottomY) {
    drawGuide(rightX, rightTouchY, rightEndY, 1, 1, 0);
    drawGuide(rightX, rightTouchY, rightEndY, 2, 0.35, 6);
  }
}

function getGuideEndY(state, glass, activeBody, bottomY, guideX) {
  const floorY = glass.top + GLASS_HEIGHT;
  let nearestY = floorY;
  const bodies = Composite.allBodies(state.world);
  for (const body of bodies) {
    if (body === activeBody || body.parent !== body) {
      continue;
    }
    if (body.isStatic || body.plugin?.isGlass || body.plugin?.burst?.active) {
      continue;
    }
    const b = body.bounds;
    if (b.min.y < bottomY) {
      continue;
    }
    if (guideX < b.min.x || guideX > b.max.x) {
      continue;
    }
    if (b.min.y < nearestY) {
      nearestY = b.min.y;
    }
  }
  return nearestY;
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
  ctx.fillStyle = hexToRgba(color, WAIT_FILL_OVERLAY_ALPHA);
  ctx.fillRect(
    bounds.min.x,
    bounds.min.y,
    bounds.max.x - bounds.min.x,
    fillHeight
  );
  ctx.restore();
}

function getChainShimmer(state, body) {
  if (!state?.chainShimmerEvents || state.chainShimmerEvents.length === 0) {
    return null;
  }
  const now =
    state?.engine?.timing?.timestamp ??
    (typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now());
  for (const event of state.chainShimmerEvents) {
    if (!event || event.bodyId !== body.id) {
      continue;
    }
    if (now < event.startMs || now > event.endMs) {
      continue;
    }
    const duration = Math.max(1, CHAIN_SHIMMER_DURATION_MS);
    const t = Math.max(0, Math.min(1, (now - event.startMs) / duration));
    return { progress: t };
  }
  return null;
}

function drawChainShimmerBand(ctx, body, drawWidth, drawHeight, progress) {
  const bandWidth = drawWidth * CHAIN_SHIMMER_BAND_RATIO;
  const bandX = -drawWidth / 2 - bandWidth + (drawWidth + bandWidth * 2) * progress;
  const bandY = -drawHeight / 2;
  ctx.save();
  const cos = Math.cos(-body.angle);
  const sin = Math.sin(-body.angle);
  ctx.beginPath();
  const vx0 = body.vertices[0].x - body.position.x;
  const vy0 = body.vertices[0].y - body.position.y;
  ctx.moveTo(vx0 * cos - vy0 * sin, vx0 * sin + vy0 * cos);
  for (let i = 1; i < body.vertices.length; i += 1) {
    const vx = body.vertices[i].x - body.position.x;
    const vy = body.vertices[i].y - body.position.y;
    ctx.lineTo(vx * cos - vy * sin, vx * sin + vy * cos);
  }
  ctx.closePath();
  ctx.clip();

  const shimmer = ctx.createLinearGradient(bandX, bandY, bandX + bandWidth, bandY);
  shimmer.addColorStop(0, "rgba(255, 255, 255, 0)");
  shimmer.addColorStop(0.5, `rgba(255, 255, 255, ${CHAIN_SHIMMER_ALPHA})`);
  shimmer.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = shimmer;
  ctx.fillRect(bandX, bandY, bandWidth, drawHeight);
  ctx.restore();
}

function drawChainShimmerBandWorld(ctx, body, progress) {
  const bounds = body.bounds;
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;
  if (width <= 0 || height <= 0) {
    return;
  }
  const bandWidth = width * CHAIN_SHIMMER_BAND_RATIO;
  const bandX = bounds.min.x - bandWidth + (width + bandWidth * 2) * progress;
  const bandY = bounds.min.y;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
  for (let i = 1; i < body.vertices.length; i += 1) {
    ctx.lineTo(body.vertices[i].x, body.vertices[i].y);
  }
  ctx.closePath();
  ctx.clip();
  const shimmer = ctx.createLinearGradient(bandX, bandY, bandX + bandWidth, bandY);
  shimmer.addColorStop(0, "rgba(255, 255, 255, 0)");
  shimmer.addColorStop(0.5, `rgba(255, 255, 255, ${CHAIN_SHIMMER_ALPHA})`);
  shimmer.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = shimmer;
  ctx.fillRect(bandX, bandY, bandWidth, height);
  ctx.restore();
}
