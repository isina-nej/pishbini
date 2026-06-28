import { NextResponse } from "next/server";
import { findReferrerByCode } from "@/lib/referral-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const referrer = await findReferrerByCode(searchParams.get("code") ?? "");

  if (!referrer) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    referralCode: referrer.referralCode,
    referrerFirstName: referrer.firstName,
    referrerLastName: referrer.lastName,
  });
}
