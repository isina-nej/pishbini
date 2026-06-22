import { NextResponse } from "next/server";
import { getPageAccessSettings } from "@/lib/page-access.server";

export async function GET() {
  try {
    const pages = await getPageAccessSettings();
    return NextResponse.json({ pages });
  } catch {
    return NextResponse.json({ error: "خطا در دریافت تنظیمات" }, { status: 500 });
  }
}
