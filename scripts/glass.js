import {
  GLASS_HEIGHT,
  GLASS_WIDTH,
  FLOOR_THICKNESS,
  HUD_TOP_RESERVE,
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

    glassBodies = [leftWall, rightWall, floor];
    World.add(world, glassBodies);
  }

  function getRect() {
    return glassRect;
  }

  return { build, getRect };
}
