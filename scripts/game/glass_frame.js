import { GLASS_WIDTH } from "../config.js";

const FRAME_SRC = "./assets/levelUI/glass_frame.png";
const FRAME_WIDTH = 512;
const FRAME_HEIGHT = 768;
const FRAME_GLASS_LEFT = 96;
const FRAME_GLASS_TOP = 8;
const FRAME_GLASS_WIDTH = 320;

let frameImage = null;

function getFrameImage() {
  if (frameImage) {
    return frameImage;
  }
  const image = new Image();
  image.onerror = () => {
    image._broken = true;
  };
  image.src = FRAME_SRC;
  frameImage = image;
  return frameImage;
}

export function drawGlassFrame(ctx, getGlassRect, render) {
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
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}
