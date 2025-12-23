export const UNIT = 32;
export const GLASS_WIDTH = 10 * UNIT;
export const GLASS_HEIGHT = 20 * UNIT;
export const WALL_THICKNESS = 24;
export const SPAWN_OFFSET = 2 * UNIT;
export const KILL_OFFSET = 3 * UNIT;

export const BLOCK_OPTIONS = {
  friction: 0.8,
  frictionStatic: 0.9,
  restitution: 0.02,
  frictionAir: 0.02,
  density: 0.002,
};

export const WAIT_DURATION_MS = 5000;
export const CONTROL_SPEED = 220;
export const DROP_SPEED = 6;
export const ROTATE_RANGE = Math.PI / 2;
export const COLORS = ["#4dd0e1", "#ffd166", "#ef476f", "#06d6a0"];
export const TARGET_AREA = 0.8 * 4 * UNIT * UNIT;
export const SHAPE_SCALE = Math.sqrt(0.8);
export const KILL_DURATION_MS = 10000;
