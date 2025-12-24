import {
  BLOCK_OPTIONS,
  COLORS,
  ROTATE_RANGE,
  SHAPE_SCALE,
  TARGET_AREA,
  UNIT,
} from "./config.js";

const { Bodies, Body } = Matter;

export function createRandomSpec(colorsCount, rotationRange) {
  const type = Math.floor(Math.random() * 7);
  const clampedColors = Math.max(1, Math.min(colorsCount || COLORS.length, COLORS.length));
  const color = COLORS[Math.floor(Math.random() * clampedColors)];
  const range = typeof rotationRange === "number" ? rotationRange : ROTATE_RANGE;
  const baseRotation = (Math.random() - 0.5) * range * 2;
  const discreteAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  const discreteRotation =
    discreteAngles[Math.floor(Math.random() * discreteAngles.length)];
  const rotation = baseRotation + discreteRotation;
  return { type, color, rotation };
}

export function createShape(spec, spawnPoint, options = {}) {
  const shapes = [
    () =>
      Bodies.rectangle(
        spawnPoint.x,
        spawnPoint.y,
        4 * UNIT * SHAPE_SCALE,
        UNIT * SHAPE_SCALE,
        BLOCK_OPTIONS
      ),
    () =>
      Bodies.rectangle(
        spawnPoint.x,
        spawnPoint.y,
        2 * UNIT * SHAPE_SCALE,
        2 * UNIT * SHAPE_SCALE,
        BLOCK_OPTIONS
      ),
    () => createTriangle(spawnPoint),
    () => createCircle(spawnPoint),
    () => createLShape(spawnPoint),
    () => createDiamond(spawnPoint),
    () => createTShape(spawnPoint),
  ];

  const body = shapes[spec.type]();
  applyStrokeStyle(body, spec.color, options.alpha);
  Body.rotate(body, spec.rotation);
  return body;
}

function applyStrokeStyle(body, color, alpha) {
  body.plugin = { ...(body.plugin || {}), color };
  const parts = body.parts.length > 1 ? body.parts : [body];
  const stroke =
    typeof alpha === "number" ? hexToRgba(color, alpha) : color;
  for (const part of parts) {
    part.render.strokeStyle = stroke;
    part.render.lineWidth = 2;
    part.render.fillStyle = "rgba(0, 0, 0, 0)";
  }
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createTriangle(spawn) {
  const radius = Math.sqrt((4 * TARGET_AREA) / (3 * Math.sqrt(3)));
  return Bodies.polygon(spawn.x, spawn.y, 3, radius, BLOCK_OPTIONS);
}

function createCircle(spawn) {
  const radius = Math.sqrt(TARGET_AREA / Math.PI);
  return Bodies.circle(spawn.x, spawn.y, radius, BLOCK_OPTIONS);
}

function createLShape(spawn) {
  const vertical = Bodies.rectangle(
    spawn.x - (UNIT * SHAPE_SCALE) / 2,
    spawn.y,
    UNIT * SHAPE_SCALE,
    3 * UNIT * SHAPE_SCALE,
    BLOCK_OPTIONS
  );
  const horizontal = Bodies.rectangle(
    spawn.x + (UNIT * SHAPE_SCALE) / 2,
    spawn.y + UNIT * SHAPE_SCALE,
    2 * UNIT * SHAPE_SCALE,
    UNIT * SHAPE_SCALE,
    BLOCK_OPTIONS
  );
  const body = Body.create({
    parts: [vertical, horizontal],
    ...BLOCK_OPTIONS,
  });
  Body.setPosition(body, spawn);
  return body;
}

function createDiamond(spawn) {
  const a = Math.sqrt(TARGET_AREA / 1.2);
  const b = a * 0.6;
  const vertices = [
    { x: 0, y: -a },
    { x: b, y: 0 },
    { x: 0, y: a },
    { x: -b, y: 0 },
  ];
  return Bodies.fromVertices(spawn.x, spawn.y, vertices, BLOCK_OPTIONS, true);
}

function createTShape(spawn) {
  const bar = Bodies.rectangle(
    spawn.x,
    spawn.y - (UNIT * SHAPE_SCALE) / 2,
    3 * UNIT * SHAPE_SCALE,
    UNIT * SHAPE_SCALE,
    BLOCK_OPTIONS
  );
  const stem = Bodies.rectangle(
    spawn.x,
    spawn.y + (UNIT * SHAPE_SCALE) / 2,
    UNIT * SHAPE_SCALE,
    2 * UNIT * SHAPE_SCALE,
    BLOCK_OPTIONS
  );
  const body = Body.create({
    parts: [bar, stem],
    ...BLOCK_OPTIONS,
  });
  Body.setPosition(body, spawn);
  return body;
}
