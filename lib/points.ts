import type { PointRuleKey } from "@/generated/prisma";
import { prisma } from "@/lib/db";

export async function getActivePointRule(key: PointRuleKey) {
  const rule = await prisma.pointRule.findFirst({
    where: { key, active: true },
  });
  if (!rule) {
    throw new Error(`Point rule not found or inactive: ${key}`);
  }
  return rule;
}

export async function getActivePointRules(keys: PointRuleKey[]) {
  const rules = await prisma.pointRule.findMany({
    where: { key: { in: keys }, active: true },
  });
  const map = new Map(rules.map((r) => [r.key, r.points]));
  for (const key of keys) {
    if (!map.has(key)) {
      throw new Error(`Point rule not found or inactive: ${key}`);
    }
  }
  return map;
}
