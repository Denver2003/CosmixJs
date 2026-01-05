import {
  SHAPE_SPRITE_PACK,
  SHAPE_SPRITE_PADDING,
  SHAPE_SPRITE_SCALE,
} from "../config.js";

const { Composite } = Matter;

const imageCache = new Map();

function loadImage(src) {
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }
  const image = new Image();
  image.src = src;
  imageCache.set(src, image);
  return image;
}

function getShapeImages(shapeName) {
  const base = `assets/sprite_packs/${SHAPE_SPRITE_PACK}`;
  return {
    outline: loadImage(`${base}/${shapeName}_outline.png`),
    fill: loadImage(`${base}/${shapeName}_fill.png`),
    details: loadImage(`${base}/${shapeName}_details.png`),
  };
}

export function drawShapeSprites(state, ctx) {
  const bodies = Composite.allBodies(state.world);
  for (const body of bodies) {
    if (body.parent !== body) {
      continue;
    }
    const isWaiting = state.waitingBody && body === state.waitingBody;
    if (body.isStatic && !isWaiting) {
      continue;
    }
    const sprite = body.plugin?.sprite;
    if (!sprite) {
      continue;
    }
    const { shapeName } = sprite;
    if (!shapeName) {
      continue;
    }
    const color = body.plugin?.color;
    if (!color) {
      continue;
    }
    const { outline, fill, details } = getShapeImages(shapeName);
    const scale = body.plugin?.scaleCurrent || 1;
    const alpha = body.plugin?.preview ? body.plugin?.previewAlpha ?? 0.4 : 1;
    const { width, height, angleOffset = 0 } = sprite;
    const drawWidth = width + getSpritePaddingWorld() * 2;
    const drawHeight = height + getSpritePaddingWorld() * 2;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle + angleOffset);
    ctx.scale(scale, scale);

    drawLayer(ctx, fill, drawWidth, drawHeight, color, alpha, 0.45);
    drawLayer(ctx, outline, drawWidth, drawHeight, null, alpha);
    drawLayer(ctx, details, drawWidth, drawHeight, null, alpha);

    ctx.restore();
  }
}

function drawLayer(ctx, image, width, height, tint, alpha, tintAlpha = 1) {
  if (!image || !image.complete || image.naturalWidth === 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    image,
    -width / 2,
    -height / 2,
    width,
    height
  );
  if (tint) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = alpha * tintAlpha;
    ctx.fillStyle = tint;
    ctx.fillRect(-width / 2, -height / 2, width, height);
  }
  ctx.restore();
}

function getSpritePaddingWorld() {
  return SHAPE_SPRITE_PADDING / SHAPE_SPRITE_SCALE;
}
