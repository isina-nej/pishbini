import {
  PointRuleKey,
  PointTransactionType,
  Prisma,
} from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { getBracketConfig } from "@/lib/bracket/config";
import { validateChampionMatchesFinal, validateFullBracket } from "@/lib/bracket/validation";
import { matchesInStageOrder, buildMatchMap, resolveMatchTeams } from "@/lib/bracket/progression";
import type { BracketPicks, BracketTree } from "@/lib/bracket/types";
import { isCampaignFrozen } from "@/lib/campaign";
import { maskPhone } from "@/lib/masking";
import { normalizePhone } from "@/lib/phone";
import { getActivePointRule } from "@/lib/points";
import { generateReferralCode } from "@/lib/referral";
import { awardReferralIfEligible } from "@/lib/referral-reward";
import { sendConfirmationSms } from "@/lib/sms";
import { getReferralLink } from "@/lib/utils";

export type BracketSubmitInput = {
  firstName: string;
  lastName: string;
  phone: string;
  referralCode?: string | null;
  picks: BracketPicks;
  championTeamId: string;
};

export type BracketSubmitResult = {
  firstName: string;
  lastName: string;
  phone: string;
  championTeamId: string;
  referralCode: string;
  referralLink: string;
};

export async function loadBracketTree(): Promise<BracketTree | null> {
  const matches = await prisma.bracketMatch.findMany({
    orderBy: [{ stage: "asc" }, { position: "asc" }],
  });
  if (matches.length === 0) return null;

  const teamIds = new Set<string>();
  for (const m of matches) {
    if (m.homeTeamId) teamIds.add(m.homeTeamId);
    if (m.awayTeamId) teamIds.add(m.awayTeamId);
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: [...teamIds] } },
  });

  return {
    matches: matches.map((m) => ({
      id: m.id,
      stage: m.stage,
      position: m.position,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeSourceMatchId: m.homeSourceMatchId,
      awaySourceMatchId: m.awaySourceMatchId,
      nextMatchId: m.nextMatchId,
      nextMatchSlot: m.nextMatchSlot,
    })),
    teams: Object.fromEntries(
      teams.map((t) => [
        t.id,
        { id: t.id, nameFa: t.nameFa, nameEn: t.nameEn, code: t.code, flagUrl: t.flagUrl },
      ])
    ),
  };
}

export async function processBracketSubmission(
  input: BracketSubmitInput
): Promise<
  { success: true; data: BracketSubmitResult } | { success: false; error: string; status: number }
> {
  const config = await getBracketConfig();
  if (!config.enabled || !config.published) {
    return { success: false, error: "جدول مرحله حذفی هنوز منتشر نشده است.", status: 403 };
  }
  if (!config.submissionOpen) {
    return { success: false, error: "مهلت ثبت پیش‌بینی جدول حذفی به پایان رسیده است.", status: 403 };
  }
  if (await isCampaignFrozen()) {
    return { success: false, error: "کمپین به پایان رسیده است.", status: 403 };
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { success: false, error: "شماره موبایل معتبر نیست.", status: 400 };
  }

  const tree = await loadBracketTree();
  if (!tree) {
    return { success: false, error: "اطلاعات جدول حذفی کامل نیست.", status: 400 };
  }

  const validation = validateFullBracket(input.picks, tree);
  if (!validation.valid) {
    return { success: false, error: validation.error, status: 400 };
  }

  if (!validateChampionMatchesFinal(input.picks, tree, input.championTeamId)) {
    return { success: false, error: "قهرمان با برنده فینال مطابقت ندارد.", status: 400 };
  }

  const existingByPhone = await prisma.user.findUnique({
    where: { phone },
    include: { bracketSubmission: true },
  });
  if (existingByPhone?.bracketSubmission) {
    return {
      success: false,
      error: "شما قبلاً پیش‌بینی جدول حذفی ثبت کرده‌اید.",
      status: 409,
    };
  }

  const referralCodeInput = input.referralCode?.trim().toUpperCase() || null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { phone },
        include: { bracketSubmission: true },
      });

      if (user?.bracketSubmission) {
        throw new BracketSubmitError("شما قبلاً پیش‌بینی جدول حذفی ثبت کرده‌اید.", 409);
      }

      const isNewUser = !user;

      if (!user) {
        let code = generateReferralCode();
        for (let i = 0; i < 10; i++) {
          const exists = await tx.user.findUnique({ where: { referralCode: code } });
          if (!exists) break;
          code = generateReferralCode();
        }
        user = {
          ...(await tx.user.create({
            data: {
              firstName: input.firstName.trim(),
              lastName: input.lastName.trim(),
              phone,
              referralCode: code,
              referredByCode: referralCodeInput,
            },
          })),
          bracketSubmission: null,
        };
      }

      if (!user.basePointsAwarded) {
        try {
          const baseRule = await getActivePointRuleInTx(tx, PointRuleKey.BASE_REGISTRATION);
          await tx.user.update({
            where: { id: user.id },
            data: { points: { increment: baseRule.points }, basePointsAwarded: true },
          });
          await tx.pointTransaction.create({
            data: {
              userId: user.id,
              type: PointTransactionType.BASE_REGISTRATION,
              points: baseRule.points,
              reason: "امتیاز ثبت‌نام",
            },
          });
        } catch {
          /* point rule optional for bracket-only users */
        }
      }

      await awardReferralIfEligible(tx, {
        isNewUser,
        userId: user.id,
        phone,
        referralCodeInput,
      });

      await tx.bracketSubmission.create({
        data: {
          userId: user.id,
          championTeamId: input.championTeamId,
        },
      });

      const matchMap = buildMatchMap(tree);
      for (const match of matchesInStageOrder(tree)) {
        const winnerId = input.picks[match.id];
        if (!winnerId) continue;
        const resolved = resolveMatchTeams(match, input.picks, matchMap, tree.teams);
        if (!resolved.isReady) {
          throw new BracketSubmitError("مسابقه نامعتبر در پیش‌بینی.", 400);
        }
        await tx.bracketPick.create({
          data: {
            userId: user!.id,
            bracketMatchId: match.id,
            winnerTeamId: winnerId,
          },
        });
      }

      return user!;
    });

    sendConfirmationSms(result.id, result.phone, result.referralCode).catch(console.error);

    return {
      success: true,
      data: {
        firstName: result.firstName,
        lastName: result.lastName,
        phone: maskPhone(result.phone),
        championTeamId: input.championTeamId,
        referralCode: result.referralCode,
        referralLink: getReferralLink(result.referralCode),
      },
    };
  } catch (err) {
    if (err instanceof BracketSubmitError) {
      return { success: false, error: err.message, status: err.status };
    }
    throw err;
  }
}

class BracketSubmitError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function getActivePointRuleInTx(tx: Prisma.TransactionClient, key: PointRuleKey) {
  const rule = await tx.pointRule.findFirst({ where: { key, active: true } });
  if (!rule) throw new Error(`Point rule not found: ${key}`);
  return rule;
}

export async function serializeBracketForApi(tree: BracketTree) {
  const allTeamIds = new Set<string>();
  for (const m of tree.matches) {
    if (m.homeTeamId) allTeamIds.add(m.homeTeamId);
    if (m.awayTeamId) allTeamIds.add(m.awayTeamId);
  }
  const teams = await prisma.team.findMany({
    where: { id: { in: [...allTeamIds] } },
  });
  const teamMap = Object.fromEntries(
    teams.map((t) => [
      t.id,
      { id: t.id, nameFa: t.nameFa, nameEn: t.nameEn, code: t.code, flagUrl: t.flagUrl },
    ])
  );
  return {
    matches: tree.matches,
    teams: teamMap,
  };
}
