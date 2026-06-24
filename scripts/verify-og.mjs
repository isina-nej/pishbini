#!/usr/bin/env node
/**
 * Verify Open Graph / Twitter Card metadata for social link previews.
 *
 * Usage:
 *   node scripts/verify-og.mjs [url]
 *   node scripts/verify-og.mjs http://127.0.0.1:3001   # on VPS (hairpin-safe)
 *   node scripts/verify-og.mjs https://wc.pishrosarmaye.com
 */
const baseUrl = (process.argv[2] ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
const homeUrl = `${baseUrl}/`;
const botUa = "TelegramBot (like TwitterBot)";
const isLocalFetch = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl);
const publicBase =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://wc.pishrosarmaye.com";

function extractMeta(html, attr) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
    "i"
  );
  const match = html.match(re);
  return match?.[1] ?? match?.[2] ?? null;
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

async function fetchWithTimeout(url, init = {}) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
}

console.log(`Checking OG metadata at ${homeUrl}`);

let homeRes;
try {
  homeRes = await fetchWithTimeout(homeUrl, {
    headers: { "User-Agent": botUa },
    redirect: "follow",
  });
} catch (error) {
  const hint = isLocalFetch
    ? ""
    : "\nTip: on the VPS, public domain may not loop back (hairpin NAT). Try:\n  npm run verify:og:local";
  fail(`Could not reach ${homeUrl}: ${error instanceof Error ? error.message : error}${hint}`);
}

if (!homeRes.ok) {
  fail(`Homepage returned HTTP ${homeRes.status}`);
}

const html = await homeRes.text();
const ogTitle = extractMeta(html, "og:title");
const ogDescription = extractMeta(html, "og:description");
const ogImage = extractMeta(html, "og:image");
const twitterCard = extractMeta(html, "twitter:card");

if (!ogTitle) fail("Missing og:title");
if (!ogDescription) fail("Missing og:description");
if (!ogImage) fail("Missing og:image");
if (!twitterCard) fail("Missing twitter:card");

if (!ogImage.startsWith("https://")) {
  fail(`og:image must be absolute HTTPS URL, got: ${ogImage}`);
}

const expectedPublicImage = `${publicBase}/og/og-image.png`;
if (ogImage !== expectedPublicImage) {
  console.warn(`WARN: og:image is ${ogImage} (expected ${expectedPublicImage})`);
}

console.log("OK meta tags:");
console.log(`  og:title       = ${ogTitle}`);
console.log(`  og:description = ${ogDescription.slice(0, 60)}...`);
console.log(`  og:image       = ${ogImage}`);
console.log(`  twitter:card   = ${twitterCard}`);

async function headImage(url) {
  return fetchWithTimeout(url, { method: "HEAD", redirect: "follow" });
}

let imageRes;
const localImageUrl = `${baseUrl}/og/og-image.png`;

if (isLocalFetch) {
  try {
    imageRes = await headImage(localImageUrl);
  } catch {
    imageRes = null;
  }
  if (!imageRes?.ok) {
    fail(`OG image not served locally at ${localImageUrl} (HTTP ${imageRes?.status ?? "error"})`);
  }
  console.log(`OK local og image: ${localImageUrl}`);

  try {
    const publicRes = await headImage(ogImage);
    if (publicRes.ok) {
      console.log(`OK public og image: ${ogImage}`);
    } else {
      console.warn(
        `WARN: public og image returned HTTP ${publicRes.status} from this host — often hairpin NAT; Telegram may still work`
      );
    }
  } catch {
    console.warn(
      "WARN: public og image unreachable from this host — often hairpin NAT; Telegram/Twitter fetch from outside"
    );
  }
} else {
  try {
    imageRes = await headImage(ogImage);
  } catch (error) {
    fail(`OG image unreachable: ${error instanceof Error ? error.message : error}`);
  }
  if (!imageRes.ok) {
    fail(`OG image returned HTTP ${imageRes.status} for ${ogImage}`);
  }
}

const contentType = imageRes.headers.get("content-type") ?? "";
if (!contentType.includes("image/png")) {
  fail(`OG image content-type must be image/png, got: ${contentType || "(empty)"}`);
}

console.log(`OK og image: HTTP ${imageRes.status}, ${contentType}`);
console.log("All OG checks passed.");
