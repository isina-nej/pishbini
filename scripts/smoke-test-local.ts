/**
 * API + HTML smoke tests without browser.
 * Usage: npx tsx scripts/smoke-test-local.ts
 */
import "dotenv/config";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

type Check = { name: string; ok: boolean; detail?: string };

const checks: Check[] = [];

function record(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function getJson(path: string) {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { res, json, text: text.slice(0, 200) };
}

async function main() {
  const home = await fetch(`${BASE}/`);
  record("GET /", home.ok, `status ${home.status}`);
  const html = await home.text();
  record("Home HTML has title", html.includes("پیش‌بینی جام جهانی"));

  const matches = await getJson("/api/matches");
  const matchList =
    matches.json && typeof matches.json === "object" && "matches" in matches.json
      ? (matches.json as { matches: unknown[] }).matches
      : [];
  record("GET /api/matches", matches.res.ok, `${matchList.length} matches`);
  if (matchList.length > 0) {
    const m = matchList[0] as { homeTeam?: { flagUrl?: string }; awayTeam?: { flagUrl?: string } };
    record("Match flags local", Boolean(m.homeTeam?.flagUrl?.startsWith("/flags/")));
  }

  const lb = await getJson("/api/leaderboard");
  record("GET /api/leaderboard", lb.res.ok);

  const bracket = await getJson("/api/bracket");
  const bMatches =
    bracket.json && typeof bracket.json === "object" && "matches" in bracket.json
      ? (bracket.json as { matches: unknown[] }).matches
      : [];
  record("GET /api/bracket", bracket.res.ok, `${bMatches.length} bracket matches`);

  const session = await getJson("/api/me/session");
  const loggedIn =
    session.json && typeof session.json === "object" && "loggedIn" in session.json
      ? (session.json as { loggedIn: boolean }).loggedIn
      : undefined;
  record("GET /api/me/session unauth", session.res.ok && loggedIn === false, `loggedIn=${loggedIn}`);

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
