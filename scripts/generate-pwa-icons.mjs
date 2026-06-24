#!/usr/bin/env node
/**
 * Generate PWA icons from public/photo/image.png
 * Requires sharp (dev dependency optional — uses dynamic import).
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "public/photo/image.png");
const outDir = path.join(root, "public/icons");

const sizes = [
  [192, "icon-192.png"],
  [512, "icon-512.png"],
  [180, "apple-touch-icon.png"],
];

const sharp = (await import("sharp")).default;
await mkdir(outDir, { recursive: true });

for (const [size, filename] of sizes) {
  await sharp(src)
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(path.join(outDir, filename));
  console.log(`wrote icons/${filename}`);
}
