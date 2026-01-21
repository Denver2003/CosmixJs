import {
  FLOOR_THICKNESS,
  GLASS_HEIGHT,
  GLASS_WIDTH,
  WALL_THICKNESS,
} from "../config.js";

function readCssNumber(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getSafeAreaInsetsPx() {
  const styles = getComputedStyle(document.documentElement);
  return {
    top: readCssNumber(styles.getPropertyValue("--safe-top")),
    right: readCssNumber(styles.getPropertyValue("--safe-right")),
    bottom: readCssNumber(styles.getPropertyValue("--safe-bottom")),
    left: readCssNumber(styles.getPropertyValue("--safe-left")),
  };
}

export function getScreenSafeArea(state, render) {
  const { top, right, bottom, left } = getSafeAreaInsetsPx();
  const scale = state.viewScale || 1;
  const viewWidth = render.options.width / scale;
  const viewHeight = render.options.height / scale;
  return {
    x: left / scale,
    y: top / scale,
    width: viewWidth - (left + right) / scale,
    height: viewHeight - (top + bottom) / scale,
  };
}

export function getScreenSafeAreaPx(render) {
  const { top, right, bottom, left } = getSafeAreaInsetsPx();
  return {
    x: left,
    y: top,
    width: render.options.width - left - right,
    height: render.options.height - top - bottom,
  };
}

export function getGlassFrame(glassRect) {
  const x = glassRect.left - WALL_THICKNESS;
  const y = glassRect.top - WALL_THICKNESS;
  return {
    x,
    y,
    width: GLASS_WIDTH + WALL_THICKNESS * 2,
    height: GLASS_HEIGHT + WALL_THICKNESS + FLOOR_THICKNESS,
  };
}

export function getGlassBorderRects(glassFrame) {
  return {
    leftBorderRect: {
      x: glassFrame.x,
      y: glassFrame.y,
      width: WALL_THICKNESS,
      height: glassFrame.height,
    },
    rightBorderRect: {
      x: glassFrame.x + glassFrame.width - WALL_THICKNESS,
      y: glassFrame.y,
      width: WALL_THICKNESS,
      height: glassFrame.height,
    },
    bottomBorderRect: {
      x: glassFrame.x,
      y: glassFrame.y + glassFrame.height - FLOOR_THICKNESS,
      width: glassFrame.width,
      height: FLOOR_THICKNESS,
    },
  };
}

export function getCapsuleLayout(render, getGlassRect) {
  const glassGetter =
    getGlassRect ||
    (typeof window !== "undefined" ? window.__getGlassRect : null);
  if (!render || typeof glassGetter !== "function") {
    return null;
  }
  const glass = glassGetter();
  const frame = getGlassFrame(glass);
  const frameScreen = worldRectToScreen(render, frame);
  const innerScreen = worldRectToScreen(render, {
    x: glass.left,
    y: glass.top,
    width: GLASS_WIDTH,
    height: GLASS_HEIGHT,
  });
  const scaleX = frameScreen.width / frame.width;
  const scaleY = frameScreen.height / frame.height;
  return {
    frame: frameScreen,
    inner: innerScreen,
    scaleX,
    scaleY,
    wall: Math.max(1, WALL_THICKNESS * scaleX),
    floor: Math.max(1, FLOOR_THICKNESS * scaleY),
  };
}

export function worldRectToScreen(render, rect) {
  const bounds = render.bounds;
  const scaleX = render.options.width / (bounds.max.x - bounds.min.x);
  const scaleY = render.options.height / (bounds.max.y - bounds.min.y);
  return {
    x: (rect.x - bounds.min.x) * scaleX,
    y: (rect.y - bounds.min.y) * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  };
}
