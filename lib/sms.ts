import { SmsStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { toPhoneE164 } from "@/lib/phone";
import { getReferralLink } from "@/lib/utils";

const SMS_TEMPLATE = `پیش‌بینی شما در کمپین جام جهانی پیشرو سرمایه ثبت شد.
با دعوت دوستانتان امتیاز بیشتری بگیرید:
{{REFERRAL_LINK}}`;

type SendResult = { success: boolean; provider: string; providerResponse?: string };

function buildMessage(referralCode: string): string {
  return SMS_TEMPLATE.replace("{{REFERRAL_LINK}}", getReferralLink(referralCode));
}

function getSmsService(): "mock" | "modirpayamak" | "melipayamak" {
  const raw = (process.env.SMS_SERVICE ?? process.env.SMS_PROVIDER ?? "mock").toLowerCase();
  if (raw === "modirpayamak" || raw === "melipayamak") return raw;
  return "mock";
}

function parseMelipayamakResult(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const code = Number(trimmed);
  if (!Number.isNaN(code) && code >= 0 && code <= 12) return false;
  return true;
}

function getIppanelConfig() {
  const apiKey = process.env.IPPANEL_API_KEY ?? process.env.PAYAMAK_API_KEY;
  const baseUrl = (
    process.env.IPPANEL_API_URL ??
    process.env.PAYAMAK_API_URL ??
    "https://edge.ippanel.com/v1"
  ).replace(/\/$/, "");
  const fromNumber = process.env.IPPANEL_FROM_NUMBER || "+983000505";
  const patternCode = process.env.IPPANEL_PATTERN_CODE;
  return { apiKey, baseUrl, fromNumber, patternCode };
}

function getIppanelConfirmPatternCode(): string | undefined {
  return process.env.IPPANEL_CONFIRM_PATTERN_CODE;
}

async function sendPatternMessage(
  phone: string,
  patternCode: string,
  params: Record<string, string>
): Promise<SendResult> {
  const { apiKey, baseUrl, fromNumber } = getIppanelConfig();

  if (!apiKey) {
    return { success: false, provider: "ippanel", providerResponse: "missing_env:IPPANEL_API_KEY" };
  }

  const phoneE164 = toPhoneE164(phone);
  if (!phoneE164) {
    return { success: false, provider: "ippanel", providerResponse: "invalid_phone" };
  }

  const payload = {
    sending_type: "pattern",
    from_number: fromNumber,
    code: patternCode,
    recipients: [phoneE164],
    params,
  };

  try {
    const response = await fetch(`${baseUrl}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      meta?: { status?: boolean; message?: string };
    };

    if (!response.ok || !data.meta?.status) {
      return {
        success: false,
        provider: "ippanel",
        providerResponse: data.meta?.message ?? `http_${response.status}`,
      };
    }

    return { success: true, provider: "ippanel", providerResponse: JSON.stringify(data.meta) };
  } catch (err) {
    return {
      success: false,
      provider: "ippanel",
      providerResponse: err instanceof Error ? err.message : "unknown_error",
    };
  }
}

/** Confirmation after submit — IPPanel pattern with referral link only (param: link) */
export async function sendConfirmationViaPattern(
  phone: string,
  referralLink: string
): Promise<SendResult> {
  const patternCode = getIppanelConfirmPatternCode();
  if (!patternCode) {
    return {
      success: false,
      provider: "ippanel",
      providerResponse: "missing_env:IPPANEL_CONFIRM_PATTERN_CODE",
    };
  }

  return sendPatternMessage(phone, patternCode, { link: referralLink });
}

/** OTP — IPPanel Edge Pattern API (text lives in IPPanel panel, param: code) */
export async function sendOtpViaPattern(
  phone: string,
  code: string
): Promise<SendResult> {
  const { patternCode } = getIppanelConfig();

  if (!patternCode) {
    return {
      success: false,
      provider: "ippanel",
      providerResponse: "missing_env:IPPANEL_PATTERN_CODE",
    };
  }

  return sendPatternMessage(phone, patternCode, { code });
}

async function sendViaModirPayamak(phone: string, message: string): Promise<SendResult> {
  const username = process.env.SMS_USERNAME;
  const password = process.env.SMS_PASSWORD;
  const from = process.env.SMS_FROM ?? "pishro";
  const apiUrl = process.env.SMS_API_URL ?? "https://sms.modirpayamak.com";

  if (!username || !password) {
    return {
      success: false,
      provider: "modirpayamak",
      providerResponse: "missing_env:SMS_USERNAME or SMS_PASSWORD",
    };
  }

  try {
    const response = await fetch(`${apiUrl}/api/SendSms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        to: phone,
        text: message,
        from,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      return { success: false, provider: "modirpayamak", providerResponse: text || `http_${response.status}` };
    }

    return { success: true, provider: "modirpayamak", providerResponse: text };
  } catch (err) {
    return {
      success: false,
      provider: "modirpayamak",
      providerResponse: err instanceof Error ? err.message : "unknown_error",
    };
  }
}

async function sendViaMelipayamak(phone: string, message: string): Promise<SendResult> {
  const username = process.env.MELIPAYAMAK_USERNAME ?? process.env.SMS_USERNAME;
  const password = process.env.MELIPAYAMAK_API_KEY ?? process.env.SMS_PASSWORD;
  const from = process.env.MELIPAYAMAK_SENDER ?? process.env.SMS_FROM ?? "";

  if (!username || !password || !from) {
    return {
      success: false,
      provider: "melipayamak",
      providerResponse: "missing_env:MELIPAYAMAK_USERNAME, MELIPAYAMAK_API_KEY, or MELIPAYAMAK_SENDER",
    };
  }

  const body = new URLSearchParams({
    username,
    password,
    to: phone,
    from,
    text: message,
    isflash: "false",
  });

  try {
    const response = await fetch(
      "https://api.payamak-panel.com/post/send.asmx/SendSimpleSMS2",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }
    );

    const result = await response.text();
    const ok = parseMelipayamakResult(result);
    return {
      success: ok,
      provider: "melipayamak",
      providerResponse: result.trim(),
    };
  } catch (err) {
    return {
      success: false,
      provider: "melipayamak",
      providerResponse: err instanceof Error ? err.message : "unknown_error",
    };
  }
}

/** General text SMS — mock | modirpayamak | melipayamak */
export async function sendSms(phone: string, message: string): Promise<SendResult> {
  const service = getSmsService();

  if (service === "mock") {
    console.log(`[SMS mock] to ${phone}: ${message}`);
    return { success: true, provider: "mock", providerResponse: "mock:ok" };
  }

  if (service === "modirpayamak") {
    return sendViaModirPayamak(phone, message);
  }

  return sendViaMelipayamak(phone, message);
}

export type BulkSmsResult = {
  phone: string;
  success: boolean;
  providerResponse?: string;
};

/** Admin bulk newsletter — Melipayamak, batched */
export async function sendBulkSmsMelipayamak(
  phones: string[],
  message: string,
  batchSize = 50
): Promise<BulkSmsResult[]> {
  const results: BulkSmsResult[] = [];

  for (let i = 0; i < phones.length; i += batchSize) {
    const batch = phones.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (phone) => {
        const res = await sendViaMelipayamak(phone, message);
        return { phone, success: res.success, providerResponse: res.providerResponse };
      })
    );
    results.push(...batchResults);
  }

  return results;
}

/** Post-registration confirmation — non-blocking; failure must not roll back submit */
export async function sendConfirmationSms(
  userId: string,
  phone: string,
  referralCode: string
): Promise<void> {
  const referralLink = getReferralLink(referralCode);
  const message = buildMessage(referralCode);

  const log = await prisma.smsLog.create({
    data: {
      userId,
      phone,
      message,
      provider: "ippanel",
      status: SmsStatus.PENDING,
    },
  });

  try {
    const result = await sendConfirmationViaPattern(phone, referralLink);
    await prisma.smsLog.update({
      where: { id: log.id },
      data: {
        provider: result.provider,
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
