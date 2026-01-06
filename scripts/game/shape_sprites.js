import { SHAPE_SPRITE_PACK } from "../config.js";

const SHAPE_SPRITE_CACHE = new Map();

export function getShapeSprite(type) {
  const key = normalizeShapeType(type);
  if (!key) {
    return null;
  }
  if (SHAPE_SPRITE_CACHE.has(key)) {
    return SHAPE_SPRITE_CACHE.get(key);
  }
  const image = new Image();
  image.onerror = () => {
    image._broken = true;
  };
  image.src = `${SHAPE_SPRITE_PACK}/${key}_outline.png`;
  SHAPE_SPRITE_CACHE.set(key, image);
  return image;
}

export function normalizeShapeType(type) {
  if (!type) {
    return null;
  }
  return String(type).toLowerCase();
}
