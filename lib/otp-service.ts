import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { sendOtpViaPattern } from "@/lib/sms";

const OTP_TTL_MS = 2 * 60 * 1000;

export function generateOtpDigits(length = 4): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
}

export async function createAndSendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { success: false, error: "شماره موبایل معتبر نیست." };
  }

  const code = generateOtpDigits();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otp.upsert({
    where: { phone: normalized },
    create: { phone: normalized, code, expiresAt },
    update: { code, expiresAt },
  });

  const sms = await sendOtpViaPattern(normalized, code);
  if (!sms.success) {
    console.error("[OTP] SMS failed:", sms.providerResponse);
  }

  return { success: true };
}

export async function verifyOtp(phone: string, code: string): Promise<{ valid: boolean; error?: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { valid: false, error: "شماره موبایل معتبر نیست." };
  }

  const otp = await prisma.otp.findUnique({ where: { phone: normalized } });
  if (!otp) {
    return { valid: false, error: "کد تأیید یافت نشد. دوباره درخواست دهید." };
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    await prisma.otp.delete({ where: { phone: normalized } }).catch(() => {});
    return { valid: false, error: "کد تأیید منقضی شده است." };
  }

  if (otp.code !== code.trim()) {
    return { valid: false, error: "کد تأیید نادرست است." };
  }

  await prisma.otp.delete({ where: { phone: normalized } });
  return { valid: true };
}
