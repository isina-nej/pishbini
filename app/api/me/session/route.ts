import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { maskPhone } from "@/lib/masking";
import {
  meUnauthorizedResponse,
  resolveUserIdFromCookies,
  MeUserError,
} from "@/lib/me-user";

export async function GET() {
  try {
    const userId = await resolveUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ loggedIn: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ loggedIn: false });
    }

    return NextResponse.json({
      loggedIn: true,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      maskedPhone: maskPhone(user.phone),
    });
  } catch (err) {
    if (err instanceof MeUserError) return meUnauthorizedResponse();
    return NextResponse.json({ error: "خطا در دریافت وضعیت حساب" }, { status: 500 });
  }
}
