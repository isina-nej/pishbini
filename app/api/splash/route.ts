import { NextResponse } from "next/server";
import { getSplashVideoPath } from "@/lib/splash-screen";

export async function GET() {
  const videoPath = await getSplashVideoPath();
  return NextResponse.json({ videoPath });
}
