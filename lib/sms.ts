import { SmsStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getReferralLink } from "@/lib/utils";

const SMS_TEMPLATE = `پیش‌بینی شما در کمپین جام جهانی پیشرو سرمایه ثبت شد.
کد دعوت اختصاصی شما: {{REFERRAL_CODE}}
با دعوت دوستانتان امتیاز بیشتری بگیرید:
{{REFERRAL_LINK}}`;

function buildMessage(referralCode: string): string {
  return SMS_TEMPLATE.replace("{{REFERRAL_CODE}}", referralCode).replace(
    "{{REFERRAL_LINK}}",
    getReferralLink(referralCode)
  );
}

async function sendViaProvider(
  phone: string,
  message: string
): Promise<{ success: boolean; providerResponse?: string }> {
  const provider = process.env.SMS_PROVIDER ?? "mock";

  if (provider === "mock") {
    console.log(`[SMS mock] to ${phone}: ${message}`);
    return { success: true, providerResponse: "mock:ok" };
  }

  // Real provider integration placeholder
  return { success: false, providerResponse: "provider:not_configured" };
}

export async function sendConfirmationSms(
  userId: string,
  phone: string,
  referralCode: string
): Promise<void> {
  const message = buildMessage(referralCode);
  const provider = process.env.SMS_PROVIDER ?? "mock";

  const log = await prisma.smsLog.create({
    data: {
      userId,
      phone,
      message,
      provider,
      status: SmsStatus.PENDING,
    },
  });

  try {
    const result = await sendViaProvider(phone, message);
    await prisma.smsLog.update({
      where: { id: log.id },
      data: {
        status: result.success ? SmsStatus.SENT : SmsStatus.FAILED,
        providerResponse: result.providerResponse,
      },
    });
  } catch (err) {
    await prisma.smsLog.update({
      where: { id: log.id },
      data: {
        status: SmsStatus.FAILED,
        providerResponse: err instanceof Error ? err.message : "unknown_error",
      },
    });
  }
}
