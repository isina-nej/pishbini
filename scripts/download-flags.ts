/**
 * Copy high-quality SVG flags from flag-icons to public/flags/{code}.svg
 * Run: npm run flags:download
 */
import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { TEAM_FLAG_ISO } from "../lib/team-flag";

async function main() {
  const srcDir = path.join(process.cwd(), "node_modules", "flag-icons", "flags", "4x3");
  const outDir = path.join(process.cwd(), "public", "flags");
  await mkdir(outDir, { recursive: true });

  for (const [code, iso] of Object.entries(TEAM_FLAG_ISO)) {
    const src = path.join(srcDir, `${iso}.svg`);
    const dest = path.join(outDir, `${code.toLowerCase()}.svg`);
    try {
      await copyFile(src, dest);
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
