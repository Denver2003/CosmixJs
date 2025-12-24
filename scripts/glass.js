import {
  GLASS_HEIGHT,
  GLASS_WIDTH,
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
        fillStyle: "rgba(0, 0, 0, 0)",
        strokeStyle: "#cfd8dc",
        lineWidth: 2,
      },
    };

    const leftWall = Bodies.rectangle(
      left - WALL_THICKNESS / 2,
      top + GLASS_HEIGHT / 2,
      WALL_THICKNESS,
      GLASS_HEIGHT + WALL_THICKNESS,
      wallOptions
    );
    const rightWall = Bodies.rectangle(
      left + GLASS_WIDTH + WALL_THICKNESS / 2,
      top + GLASS_HEIGHT / 2,
      WALL_THICKNESS,
      GLASS_HEIGHT + WALL_THICKNESS,
      wallOptions
    );
    const floor = Bodies.rectangle(
      left + GLASS_WIDTH / 2,
      top + GLASS_HEIGHT + WALL_THICKNESS / 2,
      GLASS_WIDTH + WALL_THICKNESS * 2,
      WALL_THICKNESS,
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
