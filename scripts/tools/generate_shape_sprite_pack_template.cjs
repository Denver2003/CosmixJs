const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "assets", "sprite_packs", "default");

const CELL_SIZE = 256;
const COLS = 4;
const ROWS = 2;
const ATLAS_WIDTH = CELL_SIZE * COLS;
const ATLAS_HEIGHT = CELL_SIZE * ROWS;
const FILL_ALPHA = 0.3;

const SHAPES = [
  "rectangle",
  "square",
  "triangle",
  "circle",
  "diamond",
  "oval",
  "pentagon",
];

const WHITE = { r: 255, g: 255, b: 255, a: 1 };

function createImage(width, height) {
  const buffer = Buffer.alloc(width * height * 4, 0);
  return { width, height, buffer };
}

function setPixel(img, x, y, color) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) {
    return;
  }
  const idx = (y * img.width + x) * 4;
  const a = Math.max(0, Math.min(1, color.a ?? 1));
  img.buffer[idx] = color.r;
  img.buffer[idx + 1] = color.g;
  img.buffer[idx + 2] = color.b;
  img.buffer[idx + 3] = Math.round(a * 255);
}

function drawLine(img, x0, y0, x1, y1, color) {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    setPixel(img, x0, y0, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function fillPolygon(img, points, color) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.floor(Math.min(...xs));
  const maxX = Math.ceil(Math.max(...xs));
  const minY = Math.floor(Math.min(...ys));
  const maxY = Math.ceil(Math.max(...ys));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (pointInPolygon(x + 0.5, y + 0.5, points)) {
        setPixel(img, x, y, color);
      }
    }
  }
}

function drawPolygonStroke(img, points, color) {
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    drawLine(img, Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y), color);
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function fillEllipse(img, cx, cy, rx, ry, color) {
  const minX = Math.floor(cx - rx);
  const maxX = Math.ceil(cx + rx);
  const minY = Math.floor(cy - ry);
  const maxY = Math.ceil(cy + ry);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        setPixel(img, x, y, color);
      }
    }
  }
}

function drawEllipseStroke(img, cx, cy, rx, ry, color) {
  const steps = 360;
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(t) * rx);
    const y = Math.round(cy + Math.sin(t) * ry);
    setPixel(img, x, y, color);
  }
}

function drawRect(img, x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(img, xx, yy, color);
    }
  }
}

function drawRectOutline(img, x, y, w, h, color) {
  drawLine(img, x, y, x + w, y, color);
  drawLine(img, x + w, y, x + w, y + h, color);
  drawLine(img, x + w, y + h, x, y + h, color);
  drawLine(img, x, y + h, x, y, color);
}

function drawShapeLayers(outlineImg, fillImg, detailsImg, shape, cellX, cellY) {
  const cx = cellX + CELL_SIZE / 2;
  const cy = cellY + CELL_SIZE / 2;
  const fillColor = { ...WHITE, a: FILL_ALPHA };

  if (shape === "rectangle") {
    const w = CELL_SIZE * 0.7;
    const h = CELL_SIZE * 0.18;
    const x = Math.round(cx - w / 2);
    const y = Math.round(cy - h / 2);
    drawRect(fillImg, x, y, Math.round(w), Math.round(h), fillColor);
    drawRectOutline(outlineImg, x, y, Math.round(w), Math.round(h), WHITE);
    return;
  }
  if (shape === "square") {
    const w = CELL_SIZE * 0.6;
    const x = Math.round(cx - w / 2);
    const y = Math.round(cy - w / 2);
    drawRect(fillImg, x, y, Math.round(w), Math.round(w), fillColor);
    drawRectOutline(outlineImg, x, y, Math.round(w), Math.round(w), WHITE);
    return;
  }
  if (shape === "triangle") {
    const side = CELL_SIZE * 0.7;
    const height = (Math.sqrt(3) / 2) * side;
    const points = [
      { x: cx, y: cy - height / 2 },
      { x: cx - side / 2, y: cy + height / 2 },
      { x: cx + side / 2, y: cy + height / 2 },
    ];
    fillPolygon(fillImg, points, fillColor);
    drawPolygonStroke(outlineImg, points, WHITE);
    return;
  }
  if (shape === "circle") {
    const r = CELL_SIZE * 0.28;
    fillEllipse(fillImg, cx, cy, r, r, fillColor);
    drawEllipseStroke(outlineImg, cx, cy, r, r, WHITE);
    return;
  }
  if (shape === "diamond") {
    const w = CELL_SIZE * 0.45;
    const h = CELL_SIZE * 0.7;
    const points = [
      { x: cx, y: cy - h / 2 },
      { x: cx + w / 2, y: cy },
      { x: cx, y: cy + h / 2 },
      { x: cx - w / 2, y: cy },
    ];
    fillPolygon(fillImg, points, fillColor);
    drawPolygonStroke(outlineImg, points, WHITE);
    return;
  }
  if (shape === "oval") {
    const rx = CELL_SIZE * 0.35;
    const ry = CELL_SIZE * 0.22;
    fillEllipse(fillImg, cx, cy, rx, ry, fillColor);
    drawEllipseStroke(outlineImg, cx, cy, rx, ry, WHITE);
    return;
  }
  if (shape === "pentagon") {
    const radius = CELL_SIZE * 0.32;
    const points = [];
    for (let i = 0; i < 5; i += 1) {
      const t = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      points.push({ x: cx + Math.cos(t) * radius, y: cy + Math.sin(t) * radius });
    }
    fillPolygon(fillImg, points, fillColor);
    drawPolygonStroke(outlineImg, points, WHITE);
  }
}

function writePNG(filePath, width, height, rgba) {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const chunks = [
    buildChunk("IHDR", ihdr),
    buildChunk("IDAT", compressed),
    buildChunk("IEND", Buffer.alloc(0)),
  ];
  const output = Buffer.concat([pngSignature, ...chunks]);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, output);
}

function buildChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  const crcValue = crc32(Buffer.concat([typeBuf, data]));
  crc.writeUInt32BE(crcValue, 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    const byte = buf[i];
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function main() {
  const outline = createImage(ATLAS_WIDTH, ATLAS_HEIGHT);
  const fill = createImage(ATLAS_WIDTH, ATLAS_HEIGHT);
  const details = createImage(ATLAS_WIDTH, ATLAS_HEIGHT);
  SHAPES.forEach((shape, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cellX = col * CELL_SIZE;
    const cellY = row * CELL_SIZE;
    drawShapeLayers(outline, fill, details, shape, cellX, cellY);
  });
  writePNG(path.join(OUTPUT_DIR, "outline.png"), ATLAS_WIDTH, ATLAS_HEIGHT, outline.buffer);
  writePNG(path.join(OUTPUT_DIR, "fill.png"), ATLAS_WIDTH, ATLAS_HEIGHT, fill.buffer);
  writePNG(path.join(OUTPUT_DIR, "details.png"), ATLAS_WIDTH, ATLAS_HEIGHT, details.buffer);
}

main();
