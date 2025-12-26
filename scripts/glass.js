import {
  GLASS_HEIGHT,
  GLASS_WIDTH,
  FLOOR_THICKNESS,
  HUD_TOP_RESERVE,
  HAIL_SPAWN_Y_OFFSET,
  WALL_THICKNESS,
} from "./config.js";

const { World, Bodies } = Matter;

export function createGlass(world, getViewRect) {
  let glassBodies = [];
  let glassRect = getGlassRect();

  function getGlassRect() {
    const { width } = getViewRect();
    const left = Math.round((width - GLASS_WIDTH) / 2);
    const top = Math.round(HUD_TOP_RESERVE);
    return { left, top };
  }

  function build() {
    if (glassBodies.length) {
      World.remove(world, glassBodies);
    }

    const { left, top } = getGlassRect();
    glassRect = { left, top };
    const wallOptions = {
      isStatic: true,
      friction: 0.95,
      restitution: 0.02,
      plugin: { isGlass: true },
      render: {
        fillStyle: "#cfd8dc",
        strokeStyle: "rgba(0, 0, 0, 0)",
        lineWidth: 0,
      },
    };

    const leftWall = Bodies.rectangle(
      left - WALL_THICKNESS / 2,
      top + GLASS_HEIGHT / 2 + (FLOOR_THICKNESS - WALL_THICKNESS) / 2,
      WALL_THICKNESS,
      GLASS_HEIGHT + FLOOR_THICKNESS,
      wallOptions
    );
    const rightWall = Bodies.rectangle(
      left + GLASS_WIDTH + WALL_THICKNESS / 2,
      top + GLASS_HEIGHT / 2 + (FLOOR_THICKNESS - WALL_THICKNESS) / 2,
      WALL_THICKNESS,
      GLASS_HEIGHT + FLOOR_THICKNESS,
      wallOptions
    );
    const floor = Bodies.rectangle(
      left + GLASS_WIDTH / 2,
      top + GLASS_HEIGHT + FLOOR_THICKNESS / 2,
      GLASS_WIDTH + WALL_THICKNESS * 2,
      FLOOR_THICKNESS,
      wallOptions
    );

    const extendUp = Math.max(0, HAIL_SPAWN_Y_OFFSET + WALL_THICKNESS);
    const extensionHeight = extendUp;
    const extensionCenterY = top - extensionHeight / 2;
    const extensionOptions = {
      ...wallOptions,
      render: {
        fillStyle: "rgba(0, 0, 0, 0)",
        strokeStyle: "rgba(0, 0, 0, 0)",
        lineWidth: 0,
      },
    };
    const leftExtension = Bodies.rectangle(
      left - WALL_THICKNESS / 2,
      extensionCenterY,
      WALL_THICKNESS,
      extensionHeight,
      extensionOptions
    );
    const rightExtension = Bodies.rectangle(
      left + GLASS_WIDTH + WALL_THICKNESS / 2,
      extensionCenterY,
      WALL_THICKNESS,
      extensionHeight,
      extensionOptions
    );
    glassBodies = [leftWall, rightWall, floor, leftExtension, rightExtension];
    World.add(world, glassBodies);
  }

  function getRect() {
    return glassRect;
  }

  return { build, getRect };
}
