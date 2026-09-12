const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcBuf]);
}

function createPng(size) {
  const width = size, height = size;
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  const cx = width / 2, cy = height / 2;
  const radius = width * 0.22;
  const maxCard = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);

      let inside = false;
      if (dx <= maxCard && dy <= maxCard) {
        const cornerDx = dx - (maxCard - radius);
        const cornerDy = dy - (maxCard - radius);
        if (cornerDx > 0 && cornerDy > 0) {
          if (Math.hypot(cornerDx, cornerDy) <= radius) inside = true;
        } else {
          inside = true;
        }
      }

      if (!inside) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      let r = 11, g = 15, b = 23, a = 255;
      const distCenter = Math.hypot(x - cx, y - cy);
      if (distCenter < width * 0.36) {
        r = 20; g = 26; b = 38;
      }

      // Shackle
      const shackleTop = cy - width * 0.11;
      const shackleDist = Math.hypot(x - cx, y - shackleTop);
      const shackleRadius = width * 0.12;
      const shackleThick = width * 0.04;
      if (y <= cy && shackleDist <= shackleRadius && shackleDist >= shackleRadius - shackleThick) {
        r = 96; g = 165; b = 250; // #60A5FA
      }

      // Lock body
      const lockW = width * 0.16;
      const lockH = width * 0.13;
      if (Math.abs(x - cx) <= lockW && y >= cy - width * 0.02 && y <= cy + lockH) {
        r = 59; g = 130; b = 246; // #3B82F6
        // Keyhole
        const khDist = Math.hypot(x - cx, y - (cy + width * 0.035));
        if (khDist < width * 0.03) {
          r = 11; g = 15; b = 23;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', zlib.deflateSync(rawData));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync('public/icon-192.png', createPng(192));
fs.writeFileSync('public/icon-512.png', createPng(512));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180));
console.log('Generated public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png');
