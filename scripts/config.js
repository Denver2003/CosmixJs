export const UNIT = 32;
export const GLASS_WIDTH = 10 * UNIT;
export const GLASS_HEIGHT = 20 * UNIT;
export const WALL_THICKNESS = 24;
export const SPAWN_OFFSET = 2 * UNIT;
export const SPAWN_START_OFFSET = 3 * UNIT;
export const KILL_OFFSET = 3.5 * UNIT;

export const BLOCK_OPTIONS = {
  friction: 0.8,
  frictionStatic: 0.9,
  restitution: 0.02,
  frictionAir: 0.02,
  density: 0.002,
};

export const WAIT_DURATION_MS = 5000;
export const CONTROL_SPEED = 220;
export const CONTROL_DESCENT_FACTOR = 0.6;
export const DROP_SPEED = 6;
export const ROTATE_RANGE = Math.PI / 2;
export const COLORS = [
  "#00e5ff",
  "#00ff85",
  "#ffe600",
  "#ff3b3b",
  "#b600ff",
  "#ff5bd8",
  "#ff7a00",
];
export const SHAPE_SCALE = Math.sqrt(0.8) * 0.9;
export const TARGET_AREA = 4 * UNIT * UNIT * SHAPE_SCALE * SHAPE_SCALE;
export const KILL_DURATION_MS = 10000;
export const CHAIN_MIN = 4;
export const CHAIN_DURATION_MS = 1800;
export const CHAIN_GRACE_MS = 250;
export const CHAIN_BASE_ALPHA = 0.1;
export const CHAIN_ALPHA_LERP = 0.15;
export const PREVIEW_FADE_MS = 350;
export const PREVIEW_DELAY_MS = 200;
export const DEBUG_OVERLAY = true;
