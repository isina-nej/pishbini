import { NextResponse } from "next/server";
import { getBracketConfig } from "@/lib/bracket/config";
import { loadBracketTree } from "@/lib/bracket/submit-service";
import { isGraphValid, validateBracketGraph } from "@/lib/bracket/graph";
import { prisma } from "@/lib/db";
import { withLocalFlag } from "@/lib/team-flag";

export async function GET() {
  try {
    const config = await getBracketConfig();
    const tree = await loadBracketTree();

    if (!config.enabled) {
      return NextResponse.json({
        enabled: false,
        published: false,
        submissionOpen: false,
        matches: [],
        teams: {},
        serverTime: new Date().toISOString(),
      });
    }

    if (!tree || !config.published) {
      return NextResponse.json({
        enabled: config.enabled,
        published: false,
        submissionOpen: config.submissionOpen,
        matches: [],
        teams: {},
        serverTime: new Date().toISOString(),
      });
    }

    const graphErrors = validateBracketGraph(tree.matches);
    if (!isGraphValid(tree.matches)) {
      return NextResponse.json({
        enabled: config.enabled,
        published: false,
        submissionOpen: false,
        invalid: true,
        errors: graphErrors,
        matches: [],
        teams: {},
        serverTime: new Date().toISOString(),
      });
    }

    const allTeams = await prisma.team.findMany({ where: { isActive: true } });
    const teams = Object.fromEntries(
      allTeams.map((t) => [
        t.id,
        withLocalFlag({ id: t.id, nameFa: t.nameFa, nameEn: t.nameEn, code: t.code, flagUrl: t.flagUrl }),
      ])
    );

    return NextResponse.json({
      enabled: config.enabled,
      published: config.published,
      submissionOpen: config.submissionOpen,
      version: config.version,
      matches: tree.matches,
      teams,
      serverTime: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت جدول حذفی" }, { status: 500 });
  }
}
