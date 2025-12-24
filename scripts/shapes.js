import {
  BLOCK_OPTIONS,
  COLORS,
  ROTATE_RANGE,
  SHAPE_SCALE,
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
  const cellSize = UNIT * SHAPE_SCALE;
  const shapes = [
    () =>
      Bodies.rectangle(
        spawnPoint.x,
        spawnPoint.y,
        4 * cellSize,
        cellSize,
        BLOCK_OPTIONS
      ),
    () =>
      Bodies.rectangle(
        spawnPoint.x,
        spawnPoint.y,
        2 * cellSize,
        2 * cellSize,
        BLOCK_OPTIONS
      ),
    () => createTriangle(spawnPoint, cellSize),
    () => createCircle(spawnPoint, cellSize),
    () => createDiamond(spawnPoint, cellSize),
    () => createOval(spawnPoint, cellSize),
    () => createPentagon(spawnPoint, cellSize),
  ];

  const body = shapes[spec.type]();
  applyStrokeStyle(body, spec.color, options.alpha);
  Body.rotate(body, spec.rotation);
  return body;
}

function applyStrokeStyle(body, color, alpha) {
  const customOutline = body.plugin?.customOutline;
  body.plugin = { ...(body.plugin || {}), color, customOutline };
  const parts = body.parts.length > 1 ? body.parts : [body];
  const stroke =
    typeof alpha === "number" ? hexToRgba(color, alpha) : color;
  for (const part of parts) {
    part.render.strokeStyle = customOutline ? "rgba(0, 0, 0, 0)" : stroke;
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

function createTriangle(spawn, cellSize) {
  const side = 3 * cellSize;
  const radius = side / Math.sqrt(3);
  return Bodies.polygon(spawn.x, spawn.y, 3, radius, BLOCK_OPTIONS);
}

function createCircle(spawn, cellSize) {
  const radius = 1.128 * cellSize;
  return Bodies.circle(spawn.x, spawn.y, radius, BLOCK_OPTIONS);
}

function createDiamond(spawn, cellSize) {
  const a = 2 * cellSize;
  const b = 1 * cellSize;
  const vertices = [
    { x: 0, y: -a },
    { x: b, y: 0 },
    { x: 0, y: a },
    { x: -b, y: 0 },
  ];
  return Bodies.fromVertices(spawn.x, spawn.y, vertices, BLOCK_OPTIONS, true);
}

function createOval(spawn, cellSize) {
  const ratio = 1.6;
  const targetArea = 4 * cellSize * cellSize;
  const a = Math.sqrt((targetArea * ratio) / Math.PI);
  const b = a / ratio;
  const steps = 20;
  const vertices = [];
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    vertices.push({ x: Math.cos(t) * a, y: Math.sin(t) * b });
  }
  return Bodies.fromVertices(spawn.x, spawn.y, vertices, BLOCK_OPTIONS, true);
}

function createPentagon(spawn, cellSize) {
  const targetArea = 4 * cellSize * cellSize;
  const sideSin = Math.sin((2 * Math.PI) / 5);
  const radius = Math.sqrt((2 * targetArea) / (5 * sideSin));
  return Bodies.polygon(spawn.x, spawn.y, 5, radius, BLOCK_OPTIONS);
}
