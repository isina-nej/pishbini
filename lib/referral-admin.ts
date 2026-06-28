import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { resolveReferrerIdentifier } from "@/lib/referral-server";
import { assignReferralToUser } from "@/lib/referral-reward";

export class ReferralAdminError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "ALREADY_REFERRED"
      | "REFERRER_NOT_FOUND"
      | "SELF_REFERRAL"
  ) {
    super(message);
    this.name = "ReferralAdminError";
  }
}

export async function adminAssignReferral(
  referredUserId: string,
  referrerPhoneOrCode: string,
  adminIp?: string
): Promise<{
  awarded: boolean;
  referralCode: string;
  referrerName: string;
}> {
  const referred = await prisma.user.findUnique({
    where: { id: referredUserId },
    include: { referredRecord: true },
  });

  if (!referred) {
    throw new ReferralAdminError("کاربر یافت نشد.", "NOT_FOUND");
  }
  if (referred.referredRecord || referred.referredByCode) {
    throw new ReferralAdminError("این کاربر قبلاً معرف دارد.", "ALREADY_REFERRED");
  }

  const referrer = await resolveReferrerIdentifier(referrerPhoneOrCode);
  if (!referrer) {
    throw new ReferralAdminError("معرف با این شماره یا کد یافت نشد.", "REFERRER_NOT_FOUND");
  }
  if (referrer.id === referredUserId) {
    throw new ReferralAdminError("امکان نسبت دادن دعوت به خود کاربر نیست.", "SELF_REFERRAL");
  }

  const [prediction, bracketSubmission] = await Promise.all([
    prisma.prediction.findFirst({
      where: { userId: referredUserId },
      select: { id: true },
    }),
    prisma.bracketSubmission.findUnique({
      where: { userId: referredUserId },
      select: { id: true },
    }),
  ]);
  const hasSubmission = Boolean(prediction || bracketSubmission);

  let awarded = false;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: referredUserId },
      data: { referredByCode: referrer.referralCode },
    });

    if (hasSubmission) {
      awarded = await assignReferralToUser(tx, {
        userId: referredUserId,
        referralCode: referrer.referralCode,
      });
    }
  });

  const referrerName = `${referrer.firstName} ${referrer.lastName}`;

  await writeAuditLog(
    "ADMIN_REFERRAL_ASSIGN",
    "User",
    referredUserId,
    {
      referrerUserId: referrer.id,
      referralCode: referrer.referralCode,
      awarded,
      hasSubmission,
    },
    {
      summary: `اختصاص معرف ${referrerName} به ${referred.firstName} ${referred.lastName}`,
      ip: adminIp,
    }
  );

  return {
    awarded,
    referralCode: referrer.referralCode,
    referrerName,
  };
}
