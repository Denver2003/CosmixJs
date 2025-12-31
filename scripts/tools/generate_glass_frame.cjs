const fs = require("fs");
const zlib = require("zlib");

const width = 512;
const height = 768;

const wall = 24;
const floor = 120;
const glassW = 320;
const glassH = 640;
const top = 8;
const left = Math.round((width - glassW) / 2);

const color = { r: 0xcf, g: 0xd8, b: 0xdc, a: 0xff };

const pixels = Buffer.alloc(width * height * 4, 0);

function setPixel(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return;
  }
  const idx = (y * width + x) * 4;
  pixels[idx] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
  pixels[idx + 3] = a;
}

function fillRect(x, y, w, h, c) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(width, Math.ceil(x + w));
  const y1 = Math.min(height, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      setPixel(xx, yy, c.r, c.g, c.b, c.a);
    }
  }
}

function fillCircle(cx, cy, radius, c) {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(width, Math.ceil(cx + radius));
  const y1 = Math.min(height, Math.ceil(cy + radius));
  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      const dx = xx + 0.5 - cx;
      const dy = yy + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) {
        setPixel(xx, yy, c.r, c.g, c.b, c.a);
      }
    }
  }
}

function drawGlass() {
  const wallHeight = glassH + floor;
  fillRect(left - wall, top, wall, wallHeight, color);
  fillRect(left + glassW, top, wall, wallHeight, color);
  fillRect(left - wall, top + glassH, glassW + wall * 2, floor, color);

  const radius = wall / 2;
  const capY = top - radius;
  fillCircle(left - radius, capY, radius, color);
  fillCircle(left + glassW + radius, capY, radius, color);
}

drawGlass();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crcValue = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcValue, 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

const header = Buffer.alloc(8);
header.writeUInt32BE(0x89504e47, 0);
header.writeUInt32BE(0x0d0a1a0a, 4);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const rowSize = width * 4 + 1;
const raw = Buffer.alloc(rowSize * height);
for (let y = 0; y < height; y += 1) {
  const rowStart = y * rowSize;
  raw[rowStart] = 0;
  pixels.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
}

const compressed = zlib.deflateSync(raw);
const chunks = Buffer.concat([
  header,
  chunk("IHDR", ihdr),
  chunk("IDAT", compressed),
  chunk("IEND", Buffer.alloc(0)),
]);

fs.writeFileSync("assets/levelUI/glass_frame.png", chunks);
console.log("Generated assets/levelUI/glass_frame.png");
