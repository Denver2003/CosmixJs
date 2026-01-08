import { SHAPE_SPRITE_PACK } from "../config.js";

const SHAPE_SPRITE_CACHE = new Map();

export function getShapeSprite(type, layer = "outline") {
  const key = normalizeShapeType(type);
  if (!key) {
    return null;
  }
  const cacheKey = `${key}|${layer}`;
  if (SHAPE_SPRITE_CACHE.has(cacheKey)) {
    return SHAPE_SPRITE_CACHE.get(cacheKey);
  }
  const image = new Image();
  image.onload = () => {
    image._broken = false;
    image._version = (image._version || 0) + 1;
  };
  image.onerror = () => {
    image._broken = true;
  };
  image.src = `${SHAPE_SPRITE_PACK}/${key}_${layer}.png`;
  SHAPE_SPRITE_CACHE.set(cacheKey, image);
  return image;
}

export function normalizeShapeType(type) {
  if (!type) {
    return null;
  }
  return String(type).toLowerCase();
}
