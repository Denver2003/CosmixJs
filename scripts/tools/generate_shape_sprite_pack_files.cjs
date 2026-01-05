const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { pathToFileURL } = require("url");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "assets", "sprite_packs", "default");

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

function drawShapeLayers(outlineImg, fillImg, detailsImg, geometry, scale, padding) {
  const fillColor = { ...WHITE, a: FILL_ALPHA };
  const offsetX = padding - geometry.minX * scale;
  const offsetY = padding - geometry.minY * scale;

  if (geometry.type === "ellipse") {
    const rx = geometry.rx * scale;
    const ry = geometry.ry * scale;
    const cx = padding + geometry.halfWidth * scale;
    const cy = padding + geometry.halfHeight * scale;
    fillEllipse(fillImg, cx, cy, rx, ry, fillColor);
    drawEllipseStroke(outlineImg, cx, cy, rx, ry, WHITE);
    return;
  }

  if (geometry.type === "polygon") {
    const points = geometry.points.map((p) => ({
      x: offsetX + p.x * scale,
      y: offsetY + p.y * scale,
    }));
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

function normalizePolygon(points) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  const hasFiniteBounds =
    Number.isFinite(minX) &&
    Number.isFinite(maxX) &&
    Number.isFinite(minY) &&
    Number.isFinite(maxY);
  if (!hasFiniteBounds) {
    return { points, minX: 0, minY: 0, width: 0, height: 0 };
  }
  return {
    points,
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function regularPolygonVertices(sides, radius) {
  const step = (Math.PI * 2) / sides;
  const offset = step / 2;
  const points = [];
  for (let i = 0; i < sides; i += 1) {
    const t = offset + i * step;
    points.push({ x: Math.cos(t) * radius, y: Math.sin(t) * radius });
  }
  return points;
}

function polygonCentroid(points) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const cross = a.x * b.y - b.x * a.y;
    area += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 0.000001) {
    const avg = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );
    return { x: avg.x / points.length, y: avg.y / points.length };
  }
  const factor = 1 / (6 * area);
  return { x: cx * factor, y: cy * factor };
}

function centerPolygonOnBounds(points) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  const boundsCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const centroid = polygonCentroid(points);
  const shiftX = boundsCenter.x - centroid.x;
  const shiftY = boundsCenter.y - centroid.y;
  const adjustY = 3;
  return points.map((point) => ({
    x: point.x + shiftX,
    y: point.y + shiftY + adjustY,
  }));
}

function centerPointsToBounds(points) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  return points.map((point) => ({
    x: point.x - centerX,
    y: point.y - centerY,
  }));
}

function getGeometry(shape, cellSize) {
  if (shape === "rectangle") {
    const width = 4 * cellSize;
    const height = cellSize;
    return { type: "polygon", ...normalizePolygon([
      { x: -width / 2, y: -height / 2 },
      { x: width / 2, y: -height / 2 },
      { x: width / 2, y: height / 2 },
      { x: -width / 2, y: height / 2 },
    ]) };
  }
  if (shape === "square") {
    const width = 2 * cellSize;
    const height = 2 * cellSize;
    return { type: "polygon", ...normalizePolygon([
      { x: -width / 2, y: -height / 2 },
      { x: width / 2, y: -height / 2 },
      { x: width / 2, y: height / 2 },
      { x: -width / 2, y: height / 2 },
    ]) };
  }
  if (shape === "triangle") {
    const side = 3 * cellSize;
    const radius = side / Math.sqrt(3);
    const points = centerPointsToBounds(regularPolygonVertices(3, radius));
    return { type: "polygon", ...normalizePolygon(points) };
  }
  if (shape === "circle") {
    const radius = 1.128 * cellSize;
    return {
      type: "ellipse",
      rx: radius,
      ry: radius,
      halfWidth: radius,
      halfHeight: radius,
      minX: -radius,
      minY: -radius,
      width: radius * 2,
      height: radius * 2,
    };
  }
  if (shape === "diamond") {
    const a = 2 * cellSize;
    const b = 1 * cellSize;
    return { type: "polygon", ...normalizePolygon([
      { x: 0, y: -a },
      { x: b, y: 0 },
      { x: 0, y: a },
      { x: -b, y: 0 },
    ]) };
  }
  if (shape === "oval") {
    const ratio = 1.6;
    const targetArea = 4 * cellSize * cellSize;
    const a = Math.sqrt((targetArea * ratio) / Math.PI);
    const b = a / ratio;
    return {
      type: "ellipse",
      rx: a,
      ry: b,
      halfWidth: a,
      halfHeight: b,
      minX: -a,
      minY: -b,
      width: a * 2,
      height: b * 2,
    };
  }
  if (shape === "pentagon") {
    const targetArea = 4 * cellSize * cellSize;
    const sideSin = Math.sin((2 * Math.PI) / 5);
    const radius = Math.sqrt((2 * targetArea) / (5 * sideSin));
    const points = centerPointsToBounds(regularPolygonVertices(5, radius));
    return { type: "polygon", ...normalizePolygon(points) };
  }
  return { type: "polygon", ...normalizePolygon([
    { x: -cellSize / 2, y: -cellSize / 2 },
    { x: cellSize / 2, y: -cellSize / 2 },
    { x: cellSize / 2, y: cellSize / 2 },
    { x: -cellSize / 2, y: cellSize / 2 },
  ]) };
}

async function main() {
  const configUrl = pathToFileURL(path.join(ROOT, "scripts", "config.js")).href;
  const config = await import(configUrl);
  const cellSize = config.UNIT * config.SHAPE_SCALE;
  const scale = config.SHAPE_SPRITE_SCALE;
  const padding = config.SHAPE_SPRITE_PADDING;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const shape of SHAPES) {
    const geometry = getGeometry(shape, cellSize);
    const shapePadding = padding;
    const width = Math.ceil(geometry.width * scale + shapePadding * 2);
    const height = Math.ceil(geometry.height * scale + shapePadding * 2);
    const outline = createImage(width, height);
    const fill = createImage(width, height);
    const details = createImage(width, height);
    drawShapeLayers(outline, fill, details, geometry, scale, shapePadding, shape);
    writePNG(path.join(OUTPUT_DIR, `${shape}_outline.png`), width, height, outline.buffer);
    writePNG(path.join(OUTPUT_DIR, `${shape}_fill.png`), width, height, fill.buffer);
    writePNG(path.join(OUTPUT_DIR, `${shape}_details.png`), width, height, details.buffer);
  }
}

main();
