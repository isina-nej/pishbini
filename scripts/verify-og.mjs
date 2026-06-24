#!/usr/bin/env node
/**
 * Verify Open Graph / Twitter Card metadata for social link previews.
 * Usage: node scripts/verify-og.mjs [url]
 */
const baseUrl = (process.argv[2] ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
const homeUrl = `${baseUrl}/`;
const expectedImageUrl = `${baseUrl}/og/og-image.png`;
const botUa = "TelegramBot (like TwitterBot)";

function extractMeta(html, attr, key) {
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

console.log(`Checking OG metadata at ${homeUrl}`);

const homeRes = await fetch(homeUrl, {
  headers: { "User-Agent": botUa },
  redirect: "follow",
});

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

if (ogImage !== expectedImageUrl) {
  console.warn(`WARN: og:image is ${ogImage} (expected ${expectedImageUrl})`);
}

console.log(`OK meta tags:`);
console.log(`  og:title       = ${ogTitle}`);
console.log(`  og:description = ${ogDescription.slice(0, 60)}...`);
console.log(`  og:image       = ${ogImage}`);
console.log(`  twitter:card   = ${twitterCard}`);

async function headImage(url) {
  const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000) });
  return res;
}

let imageRes;
try {
  imageRes = await headImage(ogImage);
} catch {
  imageRes = null;
}

if ((!imageRes || !imageRes.ok) && baseUrl.includes("localhost")) {
  const localImage = `${baseUrl}/og/og-image.png`;
  console.warn(`WARN: could not reach ${ogImage}, trying ${localImage}`);
  imageRes = await headImage(localImage);
}

if (!imageRes?.ok) {
  fail(`OG image unreachable (HTTP ${imageRes?.status ?? "error"}) for ${ogImage}`);
}

const contentType = imageRes.headers.get("content-type") ?? "";
if (!contentType.includes("image/png")) {
  fail(`OG image content-type must be image/png, got: ${contentType || "(empty)"}`);
}

console.log(`OK og image: HTTP ${imageRes.status}, ${contentType}`);
console.log("All OG checks passed.");
