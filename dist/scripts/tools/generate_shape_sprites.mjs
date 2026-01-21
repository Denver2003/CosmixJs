import fs from "fs";
import path from "path";
import vm from "vm";
import { createCanvas } from "canvas";
import { fileURLToPath } from "url";
import { SHAPE_SCALE, SHAPE_SPRITE_SCALE, UNIT } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const MATTER_PATH = path.join(rootDir, "lib", "matter.min.js");
const OUTPUT_DIR = path.join(
  rootDir,
  "assets",
  "shape_sprites",
  "pack_default"
);

const SPRITE_SCALE = SHAPE_SPRITE_SCALE;
const LINE_WIDTH_PX = 3;
const STROKE_COLOR = "#ffffff";
const FILL_COLOR = "#ffffff";

function loadMatter() {
  const code = fs.readFileSync(MATTER_PATH, "utf8");
  const context = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(code, context);
  return context.module.exports;
}

const Matter = loadMatter();
const { Bodies } = Matter;

const cellSize = UNIT * SHAPE_SCALE;

function createTriangle() {
  const side = 3 * cellSize;
  const radius = side / Math.sqrt(3);
  return Bodies.polygon(0, 0, 3, radius);
}

function createCircle() {
  const radius = 1.128 * cellSize;
  return Bodies.circle(0, 0, radius);
}

function createDiamond() {
  const a = 2 * cellSize;
  const b = 1 * cellSize;
  const vertices = [
    { x: 0, y: -a },
    { x: b, y: 0 },
    { x: 0, y: a },
    { x: -b, y: 0 },
  ];
  return Bodies.fromVertices(0, 0, vertices, {}, true);
}

function createOval() {
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
  return Bodies.fromVertices(0, 0, vertices, {}, true);
}

function createPentagon() {
  const targetArea = 4 * cellSize * cellSize;
  const sideSin = Math.sin((2 * Math.PI) / 5);
  const radius = Math.sqrt((2 * targetArea) / (5 * sideSin));
  return Bodies.polygon(0, 0, 5, radius);
}

const SHAPES = [
  {
    name: "rectangle",
    body: () => Bodies.rectangle(0, 0, 4 * cellSize, cellSize),
  },
  {
    name: "square",
    body: () => Bodies.rectangle(0, 0, 2 * cellSize, 2 * cellSize),
  },
  { name: "triangle", body: () => createTriangle() },
  { name: "circle", body: () => createCircle() },
  { name: "diamond", body: () => createDiamond() },
  { name: "oval", body: () => createOval() },
  { name: "pentagon", body: () => createPentagon() },
];

function getLocalVertices(body) {
  return body.vertices.map((v) => ({
    x: v.x - body.position.x,
    y: v.y - body.position.y,
  }));
}

function getBounds(vertices) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of vertices) {
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
  }
  return { minX, minY, maxX, maxY };
}

function drawShape(body, name) {
  const lineWidth = LINE_WIDTH_PX / SPRITE_SCALE;
  let bounds;
  let circleRadius = null;

  if (body.circleRadius) {
    circleRadius = body.circleRadius;
    bounds = {
      minX: -circleRadius,
      minY: -circleRadius,
      maxX: circleRadius,
      maxY: circleRadius,
    };
  } else {
    bounds = getBounds(getLocalVertices(body));
  }

  const padding = LINE_WIDTH_PX * 10;
  const width = Math.ceil((bounds.maxX - bounds.minX) * SPRITE_SCALE + padding * 2);
  const height = Math.ceil((bounds.maxY - bounds.minY) * SPRITE_SCALE + padding * 2);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.translate(width / 2, height / 2);
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = STROKE_COLOR;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const pathForShape = () => {
    ctx.beginPath();
    if (circleRadius) {
      ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
    } else {
      const local = getLocalVertices(body);
      ctx.moveTo(local[0].x, local[0].y);
      for (let i = 1; i < local.length; i += 1) {
        ctx.lineTo(local[i].x, local[i].y);
      }
      ctx.closePath();
    }
  };

  ctx.strokeStyle = STROKE_COLOR;
  pathForShape();
  ctx.stroke();

  const outPath = path.join(OUTPUT_DIR, `${name}_outline.png`);
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

  ctx.clearRect(-width / 2, -height / 2, width, height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(width / 2, height / 2);
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE);

  ctx.fillStyle = FILL_COLOR;
  pathForShape();
  ctx.fill();

  const fillPath = path.join(OUTPUT_DIR, `${name}_fill.png`);
  fs.writeFileSync(fillPath, canvas.toBuffer("image/png"));

  const detailsCanvas = createCanvas(width, height);
  const detailsPath = path.join(OUTPUT_DIR, `${name}_details.png`);
  fs.writeFileSync(detailsPath, detailsCanvas.toBuffer("image/png"));
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const shape of SHAPES) {
  drawShape(shape.body(), shape.name);
}
