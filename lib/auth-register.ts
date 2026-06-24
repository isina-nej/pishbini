import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/referral";

export async function createUserFromAuth(input: {
  phone: string;
  firstName: string;
  lastName: string;
}) {
  let code = generateReferralCode();
  let attempts = 0;
  while (attempts < 10) {
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) break;
    code = generateReferralCode();
    attempts++;
  }

  return prisma.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone,
      referralCode: code,
      basePointsAwarded: true,
    },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });
}
