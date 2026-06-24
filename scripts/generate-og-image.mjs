#!/usr/bin/env node
/**
 * Generate social preview image (1200x630) for Telegram, WhatsApp, Twitter, etc.
 */
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public/og");
const logoPath = path.join(root, "public/photo/image.png");
const fontPath = path.join(
  root,
  "node_modules/@fontsource/estedad/files/estedad-arabic-700-normal.woff"
);

const WIDTH = 1200;
const HEIGHT = 630;
const BG = "#07080f";
const PRIMARY = "#14e0bd";
const SECONDARY = "#4365ff";

const sharp = (await import("sharp")).default;
const fontBuffer = await readFile(fontPath);
const fontB64 = fontBuffer.toString("base64");

const logo = await sharp(logoPath)
  .resize(180, 180, { fit: "contain" })
  .png()
  .toBuffer();

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="55%" stop-color="#0b1224"/>
      <stop offset="100%" stop-color="#101a33"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="22%" r="45%">
      <stop offset="0%" stop-color="${PRIMARY}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${PRIMARY}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="18%" cy="78%" r="40%">
      <stop offset="0%" stop-color="${SECONDARY}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${SECONDARY}" stop-opacity="0"/>
    </radialGradient>
    <style>
      @font-face {
        font-family: Estedad;
        src: url("data:font/woff;base64,${fontB64}") format("woff");
        font-weight: 700;
        font-style: normal;
      }
      .title { font-family: Estedad, sans-serif; font-size: 58px; font-weight: 700; fill: #ffffff; }
      .subtitle { font-family: Estedad, sans-serif; font-size: 30px; font-weight: 700; fill: rgba(255,255,255,0.82); }
      .brand { font-family: Estedad, sans-serif; font-size: 24px; font-weight: 700; fill: ${PRIMARY}; }
      .cta { font-family: Estedad, sans-serif; font-size: 22px; font-weight: 700; fill: ${BG}; }
    </style>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow2)"/>
  <rect x="56" y="56" width="${WIDTH - 112}" height="${HEIGHT - 112}" rx="36" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
  <circle cx="1040" cy="120" r="120" fill="${PRIMARY}" fill-opacity="0.08"/>
  <circle cx="160" cy="520" r="90" fill="${SECONDARY}" fill-opacity="0.1"/>
  <text x="600" y="360" text-anchor="middle" class="title" direction="rtl">پیش‌بینی جام جهانی</text>
  <text x="600" y="425" text-anchor="middle" class="subtitle" direction="rtl">پیش‌بینی کن · امتیاز بگیر · برنده شو</text>
  <text x="600" y="480" text-anchor="middle" class="brand" direction="rtl">پیشرو سرمایه</text>
  <rect x="390" y="530" width="420" height="56" rx="28" fill="${PRIMARY}"/>
  <text x="600" y="566" text-anchor="middle" class="cta" direction="rtl">wc.pishrosarmaye.com</text>
</svg>`;

const textLayer = await sharp(Buffer.from(svg)).png().toBuffer();

await mkdir(outDir, { recursive: true });

await sharp({
  create: {
    width: WIDTH,
    height: HEIGHT,
    channels: 4,
    background: BG,
  },
})
  .composite([
    { input: textLayer, top: 0, left: 0 },
    { input: logo, top: 110, left: Math.round((WIDTH - 180) / 2) },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(outDir, "og-image.png"));

console.log("wrote public/og/og-image.png");
