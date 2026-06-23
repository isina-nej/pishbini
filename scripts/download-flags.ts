import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { flagIsoForTeam } from "../lib/team-flag";
import { WC2026_TEAMS } from "../lib/world-cup-2026";

/** Allow CSS background-size to stretch flags in wide match-card slots. */
function stretchableFlagSvg(raw: string): string {
  if (raw.includes("preserveAspectRatio")) return raw;
  return raw.replace("<svg ", '<svg preserveAspectRatio="none" ');
}

/**
 * Copy high-quality SVG flags from flag-icons to public/flags/{code}.svg
 * Run: npm run flags:download
 */
async function main() {
  const srcDir = path.join(process.cwd(), "node_modules", "flag-icons", "flags", "4x3");
  const outDir = path.join(process.cwd(), "public", "flags");
  await mkdir(outDir, { recursive: true });

  for (const { code } of WC2026_TEAMS) {
    const iso = flagIsoForTeam(code);
    const src = path.join(srcDir, `${iso}.svg`);
    const dest = path.join(outDir, `${code.toLowerCase()}.svg`);
    try {
      const raw = await readFile(src, "utf8");
      await writeFile(dest, stretchableFlagSvg(raw), "utf8");
      console.log(`OK ${code} -> flags/${code.toLowerCase()}.svg`);
    } catch {
      console.error(`Missing flag-icons asset: ${iso}.svg (${code})`);
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
