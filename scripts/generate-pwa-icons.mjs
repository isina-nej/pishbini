#!/usr/bin/env node
/**
 * Generate PWA icons + iOS splash screens from public/photo/image.png
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "public/photo/image.png");
const outDir = path.join(root, "public/icons");
const BG = "#07080f";

const icons = [
  [192, "icon-192.png"],
  [512, "icon-512.png"],
  [180, "apple-touch-icon.png"],
];

const splashes = [
  [1170, 2532, "apple-splash-1170x2532.png"],
  [1284, 2778, "apple-splash-1284x2778.png"],
  [1290, 2796, "apple-splash-1290x2796.png"],
];

const sharp = (await import("sharp")).default;
await mkdir(outDir, { recursive: true });

for (const [size, filename] of icons) {
  const logo = await sharp(src)
    .resize(Math.round(size * 0.62), Math.round(size * 0.62), { fit: "contain" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(path.join(outDir, filename));
  console.log(`wrote icons/${filename}`);
}

for (const [width, height, filename] of splashes) {
  const logoSize = Math.round(Math.min(width, height) * 0.28);
  const logo = await sharp(src)
    .resize(logoSize, logoSize, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(path.join(outDir, filename));
  console.log(`wrote icons/${filename}`);
}
