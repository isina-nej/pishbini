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
  localStorage.setItem("wc_splash_first_visit_done", "1");
});

await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

const splashOverlay = page.locator('[role="presentation"]');
if (await splashOverlay.isVisible().catch(() => false)) {
  await splashOverlay.click();
  await splashOverlay.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
}

await page.waitForSelector("text=پیش‌بینی جام جهانی", { timeout: 15_000 });
await page.waitForTimeout(1500);

const flags = await page.$$eval(".team-flag", (els) =>
  els.map((el) => ({
    classes: el.className,
    ok: getComputedStyle(el).backgroundImage !== "none",
    fit: getComputedStyle(el).backgroundSize,
  }))
);

await page.screenshot({ path: screenshotPath, fullPage: true });
await browser.close();

const failed = flags.filter((f) => !f.ok);
console.log(JSON.stringify({ url, screenshot: screenshotPath, flags, failed: failed.length }, null, 2));
process.exit(failed.length > 0 ? 1 : 0);
