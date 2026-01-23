import { GLASS_WIDTH } from "../config.js";

const FRAME_SRC = "./assets/levelUI/glass_frame.png";
const FRAME_WIDTH = 512;
const FRAME_HEIGHT = 768;
const FRAME_GLASS_LEFT = 96;
const FRAME_GLASS_TOP = 8;
const FRAME_GLASS_WIDTH = 320;

let frameImage = null;
let framePromise = null;

function getFrameImage() {
  if (frameImage) {
    return frameImage;
  }
  const image = new Image();
  image.addEventListener(
    "error",
    () => {
      image._broken = true;
    },
    { once: true }
  );
  image.src = FRAME_SRC;
  frameImage = image;
  return frameImage;
}

export function preloadGlassFrame() {
  if (typeof Image === "undefined") {
    return Promise.resolve(null);
  }
  const image = getFrameImage();
  if (image._broken) {
    return Promise.resolve(null);
  }
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve(image);
  }
  if (framePromise) {
    return framePromise;
  }
  framePromise = new Promise((resolve) => {
    const done = () => resolve(image);
    image.addEventListener("load", done, { once: true });
    image.addEventListener("error", () => resolve(null), { once: true });
  });
  return framePromise;
}

export function drawGlassFrame(ctx, getGlassRect, render, offset = { x: 0, y: 0 }) {
  const image = getFrameImage();
  if (image._broken || !image.complete || image.naturalWidth === 0) {
    return;
  }

  const glass = getGlassRect();
  const targetTop = render.bounds.min.y;
  const targetHeight = render.bounds.max.y - render.bounds.min.y;
  const scale = targetHeight / FRAME_HEIGHT;
  const drawWidth = FRAME_WIDTH * scale;
  const drawHeight = FRAME_HEIGHT * scale;
  const centerX = glass.left + GLASS_WIDTH / 2;
  const x = centerX - drawWidth / 2;
  const y = targetTop;
  ctx.drawImage(image, x + (offset.x || 0), y + (offset.y || 0), drawWidth, drawHeight);
}
