/**
 * Download team flags to public/flags/{code}.png
 * Run: npm run flags:download
 */
import "dotenv/config";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const TEAMS: { code: string; url: string }[] = [
  { code: "IRI", url: "https://flagcdn.com/w160/ir.png" },
  { code: "POR", url: "https://flagcdn.com/w160/pt.png" },
  { code: "ARG", url: "https://flagcdn.com/w160/ar.png" },
  { code: "BRA", url: "https://flagcdn.com/w160/br.png" },
  { code: "FRA", url: "https://flagcdn.com/w160/fr.png" },
  { code: "ESP", url: "https://flagcdn.com/w160/es.png" },
  { code: "GER", url: "https://flagcdn.com/w160/de.png" },
  { code: "ENG", url: "https://flagcdn.com/w160/gb-eng.png" },
  { code: "BEL", url: "https://flagcdn.com/w160/be.png" },
  { code: "NED", url: "https://flagcdn.com/w160/nl.png" },
  { code: "CRO", url: "https://flagcdn.com/w160/hr.png" },
  { code: "MAR", url: "https://flagcdn.com/w160/ma.png" },
  { code: "JPN", url: "https://flagcdn.com/w160/jp.png" },
  { code: "MEX", url: "https://flagcdn.com/w160/mx.png" },
  { code: "USA", url: "https://flagcdn.com/w160/us.png" },
  { code: "URU", url: "https://flagcdn.com/w160/uy.png" },
  { code: "SUI", url: "https://flagcdn.com/w160/ch.png" },
  { code: "DEN", url: "https://flagcdn.com/w160/dk.png" },
  { code: "POL", url: "https://flagcdn.com/w160/pl.png" },
  { code: "KOR", url: "https://flagcdn.com/w160/kr.png" },
  { code: "AUS", url: "https://flagcdn.com/w160/au.png" },
  { code: "ECU", url: "https://flagcdn.com/w160/ec.png" },
  { code: "SEN", url: "https://flagcdn.com/w160/sn.png" },
  { code: "WAL", url: "https://flagcdn.com/w160/gb-wls.png" },
  { code: "CMR", url: "https://flagcdn.com/w160/cm.png" },
  { code: "SRB", url: "https://flagcdn.com/w160/rs.png" },
  { code: "GHA", url: "https://flagcdn.com/w160/gh.png" },
  { code: "CRC", url: "https://flagcdn.com/w160/cr.png" },
  { code: "TUN", url: "https://flagcdn.com/w160/tn.png" },
  { code: "KSA", url: "https://flagcdn.com/w160/sa.png" },
  { code: "CAN", url: "https://flagcdn.com/w160/ca.png" },
  { code: "ITA", url: "https://flagcdn.com/w160/it.png" },
];

async function main() {
  const outDir = path.join(process.cwd(), "public", "flags");
  await mkdir(outDir, { recursive: true });

  for (const { code, url } of TEAMS) {
    const file = path.join(outDir, `${code.toLowerCase()}.png`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed ${code}: ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(file, buf);
    console.log(`OK ${code} -> flags/${code.toLowerCase()}.png`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
