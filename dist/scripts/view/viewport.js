export function createViewport(canvas) {
  const viewState = {
    width: 0,
    height: 0,
    scale: 1,
    pixelRatio: 1,
  };

  function getViewportRect() {
    const viewport = window.visualViewport;
    if (viewport) {
      return {
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
        offsetLeft: Math.round(viewport.offsetLeft || 0),
        offsetTop: Math.round(viewport.offsetTop || 0),
      };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetLeft: 0,
      offsetTop: 0,
    };
  }

  function applyFitView(viewHeight) {
    const {
      width: viewportWidth,
      height: viewportHeight,
      offsetLeft,
      offsetTop,
    } = getViewportRect();
    const scale = viewportHeight / viewHeight;
    const viewWidth = viewportWidth / scale;
    viewState.width = viewWidth;
    viewState.height = viewHeight;
    viewState.scale = scale;
    viewState.pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.style.left = `${offsetLeft}px`;
    canvas.style.top = `${offsetTop}px`;
    canvas.style.position = "absolute";
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;
    canvas.width = Math.round(viewportWidth * viewState.pixelRatio);
    canvas.height = Math.round(viewportHeight * viewState.pixelRatio);
    return { viewWidth, viewHeight, viewportWidth, viewportHeight };
  }

  function getState() {
    return { ...viewState };
  }

  return { applyFitView, getState };
}
