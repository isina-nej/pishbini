import { NextResponse } from "next/server";
import { PointRuleKey } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getCampaignInfoContent } from "@/lib/campaign-info.server";

const SCORING_KEYS: PointRuleKey[] = [
  PointRuleKey.BASE_REGISTRATION,
  PointRuleKey.CORRECT_PREDICTION,
  PointRuleKey.WRONG_PREDICTION,
  PointRuleKey.REFERRAL_SUCCESS,
];

export async function GET() {
  try {
    const [content, rules] = await Promise.all([
      getCampaignInfoContent(),
      prisma.pointRule.findMany({
        where: { key: { in: SCORING_KEYS }, active: true },
        orderBy: { key: "asc" },
      }),
    ]);

    if (!content.published) {
      return NextResponse.json({ published: false });
    }

    return NextResponse.json({
      published: true,
      content,
      pointRules: rules.map((r) => ({
        key: r.key,
        label: r.label,
        points: r.points,
        description: r.description,
      })),
    });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت اطلاعات" }, { status: 500 });
  }
}
