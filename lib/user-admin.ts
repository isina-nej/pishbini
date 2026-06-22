import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { writeAuditLog } from "@/lib/audit";

export async function deleteUserByAdmin(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.bracketPick.deleteMany({ where: { userId } });
    await tx.bracketSubmission.deleteMany({ where: { userId } });
    await tx.prediction.deleteMany({ where: { userId } });
    await tx.referral.deleteMany({
      where: { OR: [{ referrerUserId: userId }, { referredUserId: userId }] },
    });
    await tx.pointTransaction.deleteMany({ where: { userId } });
    await tx.smsLog.updateMany({ where: { userId }, data: { userId: null } });
    await tx.user.delete({ where: { id: userId } });
  });
}

export type AdminUserUpdateInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  hidden?: boolean;
};

export async function updateUserByAdmin(
  userId: string,
  input: AdminUserUpdateInput
): Promise<{ id: string; firstName: string; lastName: string; phone: string; hidden: boolean }> {
  const data: AdminUserUpdateInput = {};
  if (input.firstName !== undefined) data.firstName = input.firstName.trim();
  if (input.lastName !== undefined) data.lastName = input.lastName.trim();
  if (input.hidden !== undefined) data.hidden = input.hidden;
  if (input.phone !== undefined) {
    const phone = normalizePhone(input.phone);
    if (!phone) throw new Error("INVALID_PHONE");
    data.phone = phone;
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, firstName: true, lastName: true, phone: true, hidden: true },
  });
}
