export const UNIT = 32;
export const GLASS_WIDTH = 10 * UNIT;
export const GLASS_HEIGHT = 20 * UNIT;
export const WALL_THICKNESS = 24;
export const FLOOR_THICKNESS = WALL_THICKNESS * 1.5;
export const SPAWN_OFFSET = 2 * UNIT;
export const SPAWN_START_OFFSET = 3 * UNIT;
export const KILL_OFFSET = 3.5 * UNIT;
export const HUD_TOP_RESERVE = 2.5 * UNIT;
export const HUD_BOTTOM_RESERVE = FLOOR_THICKNESS;

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
export const CHAIN_BURST_DURATION_MS = 500;
export const CHAIN_BURST_SPEED = 8;
export const CHAIN_BURST_UPWARD_SPEED = 6;
export const CHAIN_BURST_GRAVITY = 22;
export const CHAIN_BURST_SCALE_MIN = 0.1;
export const CHAIN_BURST_SCALE_MAX = 0.35;
export const IMPACT_FLASH_DURATION_MS = 100;
export const IMPACT_FLASH_ALPHA = 0.85;
export const PREVIEW_FADE_MS = 350;
export const PREVIEW_DELAY_MS = 200;
export const DEBUG_OVERLAY = true;

export const COSMO_ENERGY_GAIN = 4;
export const COSMO_ENERGY_DECAY = 2;
export const COSMO_ENERGY_MAX = 100;
export const COSMO_ENERGY_MAX_INTERNAL = 125;
export const COSMO_ENERGY_L2 = 35;
export const COSMO_ENERGY_L3 = 70;
export const COSMO_ENERGY_L5 = 100;

export const BUBBLE_SPAWN_CHANCE = 0.1;
export const BUBBLE_MIN_RADIUS = 25;
export const BUBBLE_MAX_RADIUS = 36;
export const BUBBLE_FLOAT_SPEED_MIN = 60;
export const BUBBLE_FLOAT_SPEED_MAX = 132;
export const BUBBLE_WAVE_AMPLITUDE = 10;
export const BUBBLE_WAVE_SPEED = 1.6;
export const BUBBLE_DESPAWN_PAD = 20;
export const BUBBLE_MAX_COUNT = 10;
export const BUBBLE_SPAWN_ZONE_HEIGHT = 28;
export const BUBBLE_COOLDOWN_COINS_MS = 10000;
export const BUBBLE_COOLDOWN_POINTS1_MS = 1000;
export const BUBBLE_COOLDOWN_POINTS2_MS = 3000;
export const BUBBLE_COOLDOWN_POINTS3_MS = 5000;
export const BUBBLE_COOLDOWN_HAIL_MS = 20000;
export const BUBBLE_COOLDOWN_GRENADE_MS = 60000;
export const BUBBLE_COOLDOWN_TOUCH_MS = 300000;
export const BUBBLE_COOLDOWN_GUN_MS = 300000;
export const BUBBLE_POP_COUNT_MIN = 6;
export const BUBBLE_POP_COUNT_MAX = 10;
export const BUBBLE_POP_SPEED = 160;
export const BUBBLE_POP_BURST_MS = 180;
export const BUBBLE_POP_FALL_MS = 1000;
export const BUBBLE_POP_GRAVITY = 420;
export const BUBBLE_POP_RADIUS_MIN = 2;
export const BUBBLE_POP_RADIUS_MAX = 4;
export const BUBBLE_POP_ICON_MS = 500;

export const BACKGROUND_STAR_COUNT = 240;
export const BACKGROUND_STAR_MIN_RADIUS = 0.8;
export const BACKGROUND_STAR_MAX_RADIUS = 0.9;
export const BACKGROUND_STAR_SPEED_MIN = 0.0015;
export const BACKGROUND_STAR_SPEED_MAX = 0.008;
export const BACKGROUND_STAR_SPEED_X_MIN = 0.001;
export const BACKGROUND_STAR_SPEED_X_MAX = 0.005;
export const BACKGROUND_STAR_TWINKLE_CHANCE = 0.1;
export const BACKGROUND_STAR_ALPHA_MIN = 0.5;
export const BACKGROUND_STAR_ALPHA_MAX = 0.95;
export const BACKGROUND_STAR_TWINKLE_MIN = 0.08;
export const BACKGROUND_STAR_TWINKLE_MAX = 0.25;
export const BACKGROUND_STAR_TWINKLE_SPEED_MIN = 0.6;
export const BACKGROUND_STAR_TWINKLE_SPEED_MAX = 1.6;

export const HAIL_RESPAWN_POINTS = 10;
export const HAIL_EXTRA_COUNT = 3;
export const HAIL_SPAWN_Y_OFFSET = 48;
export const HAIL_DROP_SPEED = 10;
export const HAIL_ANGULAR_SPEED = 0.08;

export const BONUS_COOLDOWN_MS = 300000;
export const BONUS_TOUCH_DURATION_MS = 10000;
export const BONUS_GUN_SHOTS = 20;
export const BONUS_GUN_INTERVAL_MS = 160;
