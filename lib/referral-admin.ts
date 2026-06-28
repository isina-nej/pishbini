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
      | "SAME_REFERRER"
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

export async function adminChangeReferrer(
  referredUserId: string,
  newReferrerPhoneOrCode: string,
  adminIp?: string
): Promise<{
  referrerName: string;
  previousReferrerName: string | null;
  transferred: boolean;
}> {
  const referred = await prisma.user.findUnique({
    where: { id: referredUserId },
    include: {
      referredRecord: {
        include: { referrer: { select: { id: true, firstName: true, lastName: true, referralCode: true } } },
      },
    },
  });

  if (!referred) {
    throw new ReferralAdminError("کاربر یافت نشد.", "NOT_FOUND");
  }

  const newReferrer = await resolveReferrerIdentifier(newReferrerPhoneOrCode);
  if (!newReferrer) {
    throw new ReferralAdminError("معرف با این شماره یا کد یافت نشد.", "REFERRER_NOT_FOUND");
  }
  if (newReferrer.id === referredUserId) {
    throw new ReferralAdminError("امکان نسبت دادن دعوت به خود کاربر نیست.", "SELF_REFERRAL");
  }

  const existingRecord = referred.referredRecord;
  const existingCode = referred.referredByCode;

  if (!existingRecord && !existingCode) {
    const assigned = await adminAssignReferral(referredUserId, newReferrerPhoneOrCode, adminIp);
    return {
      referrerName: assigned.referrerName,
      previousReferrerName: null,
      transferred: assigned.awarded,
    };
  }

  const isSameReferrer =
    (existingRecord && existingRecord.referrerUserId === newReferrer.id) ||
    (!existingRecord && existingCode === newReferrer.referralCode);
  if (isSameReferrer) {
    throw new ReferralAdminError("معرف جدید با معرف فعلی یکسان است.", "SAME_REFERRER");
  }

  const previousReferrerName = existingRecord
    ? `${existingRecord.referrer.firstName} ${existingRecord.referrer.lastName}`
    : existingCode
      ? `(کد ${existingCode})`
      : null;

  let transferred = false;

  await prisma.$transaction(async (tx) => {
    if (existingRecord) {
      await tx.user.update({
        where: { id: existingRecord.referrerUserId },
        data: { referralCount: { decrement: 1 } },
      });
      await tx.user.update({
        where: { id: newReferrer.id },
        data: { referralCount: { increment: 1 } },
      });
      await tx.referral.update({
        where: { id: existingRecord.id },
        data: {
          referrerUserId: newReferrer.id,
          referralCode: newReferrer.referralCode,
        },
      });
      transferred = true;
    }

    await tx.user.update({
      where: { id: referredUserId },
      data: { referredByCode: newReferrer.referralCode },
    });
  });

  const referrerName = `${newReferrer.firstName} ${newReferrer.lastName}`;

  await writeAuditLog(
    "ADMIN_REFERRAL_CHANGE",
    "User",
    referredUserId,
    {
      previousReferrerName,
      newReferrerUserId: newReferrer.id,
      referralCode: newReferrer.referralCode,
      transferred,
    },
    {
      summary: `تغییر معرف ${referred.firstName} ${referred.lastName} به ${referrerName}`,
      ip: adminIp,
    }
  );

  return {
    referrerName,
    previousReferrerName,
    transferred,
  };
}
