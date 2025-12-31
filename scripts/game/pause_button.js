const PAUSE_SRC = "./assets/levelUI/pause_button.png";
let pauseImage = null;

function getPauseImage() {
  if (pauseImage) {
    return pauseImage;
  }
  const image = new Image();
  image.onerror = () => {
    image._broken = true;
  };
  image.src = PAUSE_SRC;
  pauseImage = image;
  return pauseImage;
}

export function drawPauseButton(ctx, pauseLayout) {
  const image = getPauseImage();
  if (image._broken || !image.complete || image.naturalWidth === 0) {
    return;
  }
  ctx.drawImage(image, pauseLayout.x, pauseLayout.y, pauseLayout.size, pauseLayout.size);
}
