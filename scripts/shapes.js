import {
  BLOCK_OPTIONS,
  COLORS,
  ROTATE_RANGE,
  SHAPE_SCALE,
  TARGET_AREA,
  UNIT,
} from "./config.js";

const { Bodies, Body } = Matter;

export function createRandomSpec() {
  const type = Math.floor(Math.random() * 5);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const rotation = (Math.random() - 0.5) * ROTATE_RANGE * 2;
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
