/**
 * Quick UI smoke check: skip splash, load home, screenshot match cards.
 * Usage: node scripts/verify-home.mjs [url]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const url = process.argv[2] ?? "http://localhost:3000/";
const outDir = path.join(process.cwd(), ".verify");
const screenshotPath = path.join(outDir, "home.png");

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });

await page.addInitScript(() => {
  sessionStorage.setItem("wc_splash_seen", "1");
});

await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForSelector("text=پیش‌بینی جام جهانی", { timeout: 15_000 });
await page.waitForTimeout(1500);

const flags = await page.$$eval('img[src*="/flags/"]', (imgs) =>
  imgs.map((img) => ({
    src: img.getAttribute("src"),
    ok: img.naturalWidth > 0 && img.naturalHeight > 0,
    w: img.naturalWidth,
    h: img.naturalHeight,
    fit: getComputedStyle(img).objectFit,
  }))
);

await page.screenshot({ path: screenshotPath, fullPage: true });
await browser.close();

const failed = flags.filter((f) => !f.ok);
console.log(JSON.stringify({ url, screenshot: screenshotPath, flags, failed: failed.length }, null, 2));
process.exit(failed.length > 0 ? 1 : 0);
