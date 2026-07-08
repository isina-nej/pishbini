import { prisma } from "@/lib/db";
import { computeUserScore, loadActivePointRulesMap } from "@/lib/user-score";
import { getReferralLink } from "@/lib/utils";

export type CachedAdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  referralCode: string;
  referralLink: string;
  referredByCode: string | null;
  points: number;
  totalPredictions: number;
  correctPredictions: number;
  wrongPredictions: number;
  referralCount: number;
  hidden: boolean;
  createdAt: string;
};

declare global {
  var adminUsersCache: CachedAdminUser[] | undefined;
  var adminUsersUpdating: boolean | undefined;
  var adminUsersInterval: NodeJS.Timeout | undefined;
}

export const getCachedUsers = async (): Promise<CachedAdminUser[]> => {
  if (!global.adminUsersCache || global.adminUsersCache.length === 0) {
    if (!global.adminUsersUpdating) {
      await updateAdminUsersCache();
    } else {
      // Wait briefly if it is already updating
      let retries = 0;
      while (global.adminUsersUpdating && retries < 10) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        retries++;
      }
    }
  }
  return global.adminUsersCache || [];
};

export const updateAdminUsersCache = async () => {
  if (global.adminUsersUpdating) return;
  global.adminUsersUpdating = true;
  try {
    const [users, rules] = await Promise.all([
      prisma.user.findMany({
        include: {
          _count: { select: { predictions: true } },
        },
      }),
      loadActivePointRulesMap(),
    ]);

    const mapped = users.map((u) => {
      const computedScore = computeUserScore(
        {
          basePointsAwarded: u.basePointsAwarded,
          selfReferrerBonusAwarded: u.selfReferrerBonusAwarded,
          correctCount: u.correctCount,
          wrongCount: u.wrongCount,
          referralCount: u.referralCount,
        },
        rules
      );

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        referralCode: u.referralCode,
        referralLink: getReferralLink(u.referralCode),
        referredByCode: u.referredByCode,
        points: computedScore,
        totalPredictions: u._count.predictions,
        correctPredictions: u.correctCount,
        wrongPredictions: u.wrongCount,
        referralCount: u.referralCount,
        hidden: u.hidden,
        createdAt: u.createdAt.toISOString(),
      };
    });

    // Default sort by points descending
    mapped.sort((a, b) => b.points - a.points);
    global.adminUsersCache = mapped;
  } catch (error) {
    console.error("Error updating admin users cache:", error);
  } finally {
    global.adminUsersUpdating = false;
  }
};

// Start background interval (every 60 seconds)
if (typeof window === "undefined" && !global.adminUsersInterval) {
  global.adminUsersInterval = setInterval(() => {
    updateAdminUsersCache().catch(console.error);
  }, 60000);
}
