import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeReferralCode } from "@/lib/referral";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = normalizeReferralCode(searchParams.get("code") ?? "");

  if (!code) {
    return NextResponse.json({ valid: false });
  }

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { firstName: true },
  });

  if (!referrer) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    referrerFirstName: referrer.firstName,
  });
}
