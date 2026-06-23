import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";
import {
  DEFAULT_SPLASH_VIDEO_PATH,
  getSplashVideoPath,
  resetSplashVideoPath,
  setSplashVideoPath,
} from "@/lib/splash-screen";

const MAX_BYTES = 15 * 1024 * 1024;
const SPLASH_DIR = path.join(process.cwd(), "public", "splash_screen");

export async function GET() {
  try {
    await requireAdmin();
    const videoPath = await getSplashVideoPath();
    return NextResponse.json({ videoPath });
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("video");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "فایل ویدیو الزامی است." }, { status: 400 });
    }

    if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) {
      return NextResponse.json({ error: "فقط فایل MP4 مجاز است." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "حداکثر حجم فایل ۱۵ مگابایت است." }, { status: 400 });
    }

    await mkdir(SPLASH_DIR, { recursive: true });

    const filename = `splash_upload_${Date.now()}.mp4`;
    const diskPath = path.join(SPLASH_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, buffer);

    const publicPath = `/splash_screen/${filename}`;
    await setSplashVideoPath(publicPath);
    await writeAuditLog("SPLASH_VIDEO_UPDATE", "CampaignSetting", undefined, {
      videoPath: publicPath,
      size: file.size,
    });

    return NextResponse.json({ success: true, videoPath: publicPath });
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function DELETE() {
  try {
    await requireAdmin();
    await resetSplashVideoPath();
    await writeAuditLog("SPLASH_VIDEO_RESET", "CampaignSetting");
    return NextResponse.json({
      success: true,
      videoPath: DEFAULT_SPLASH_VIDEO_PATH,
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}
