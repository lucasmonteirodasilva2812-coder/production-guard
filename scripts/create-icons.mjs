#!/usr/bin/env node
// Gera ícones placeholder para o Tauri (sem dependências externas)
import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '../src-tauri/icons');
mkdirSync(ICONS_DIR, { recursive: true });

// Verde industrial do tema (#22c55e)
const [R, G, B] = [0x22, 0xc5, 0x5e];

// ── PNG (sem deps, só zlib nativo) ───────────────────────────────────────────
function crc32(data) {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  let c = 0xffffffff;
  for (const b of data) c = t[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'latin1');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function makePNG(w, h) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    // filter byte = 0 (None) — já zero pelo alloc
    for (let x = 0; x < w; x++) {
      const i = y * (1 + w * 3) + 1 + x * 3;
      raw[i] = R; raw[i + 1] = G; raw[i + 2] = B;
    }
  }

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── ICO (BMP 32bpp, sem deps) ─────────────────────────────────────────────────
function makeICO(size) {
  const pixBytes = size * size * 4;                  // BGRA
  const maskRowBytes = Math.ceil(size / 32) * 4;     // AND mask: 1bpp por row, alinhado a DWORD
  const maskBytes = maskRowBytes * size;
  const bmpBytes = 40 + pixBytes + maskBytes;        // BITMAPINFOHEADER + dados

  const buf = Buffer.alloc(6 + 16 + bmpBytes, 0);
  let o = 0;

  // ICONDIR
  buf.writeUInt16LE(0, o); o += 2;  // reserved
  buf.writeUInt16LE(1, o); o += 2;  // type = 1 (ICO)
  buf.writeUInt16LE(1, o); o += 2;  // count = 1

  // ICONDIRENTRY
  buf[o++] = size >= 256 ? 0 : size; // width (0 = 256)
  buf[o++] = size >= 256 ? 0 : size; // height
  buf[o++] = 0; buf[o++] = 0;        // colorCount, reserved
  buf.writeUInt16LE(1, o); o += 2;   // planes
  buf.writeUInt16LE(32, o); o += 2;  // bitCount
  buf.writeUInt32LE(bmpBytes, o); o += 4;
  buf.writeUInt32LE(22, o); o += 4;  // offset = 6 + 16

  // BITMAPINFOHEADER
  buf.writeUInt32LE(40, o); o += 4;
  buf.writeInt32LE(size, o); o += 4;
  buf.writeInt32LE(size * 2, o); o += 4; // height*2 (XOR mask + AND mask)
  buf.writeUInt16LE(1, o); o += 2;   // planes
  buf.writeUInt16LE(32, o); o += 2;  // bitCount
  buf.writeUInt32LE(0, o); o += 4;   // BI_RGB
  buf.writeUInt32LE(pixBytes, o); o += 4;
  o += 16; // xPPM, yPPM, clrUsed, clrImportant (zeros)

  // Pixels BGRA, bottom-up (cor sólida, ordem não importa)
  for (let i = 0; i < size * size; i++) {
    buf[o++] = B; buf[o++] = G; buf[o++] = R; buf[o++] = 0xff;
  }
  // AND mask: todos zeros (opaco) — já zerado pelo alloc

  return buf;
}

// Escreve arquivos
writeFileSync(join(ICONS_DIR, '32x32.png'),       makePNG(32, 32));
writeFileSync(join(ICONS_DIR, '128x128.png'),     makePNG(128, 128));
writeFileSync(join(ICONS_DIR, '128x128@2x.png'),  makePNG(256, 256));
writeFileSync(join(ICONS_DIR, 'icon.icns'),       makePNG(512, 512)); // placeholder macOS
writeFileSync(join(ICONS_DIR, 'icon.ico'),        makeICO(32));

console.log('Ícones gerados em src-tauri/icons/');
