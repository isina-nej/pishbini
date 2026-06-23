"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { DEFAULT_SPLASH_VIDEO_PATH } from "@/lib/splash-screen";
import { cn } from "@/lib/utils";
import { RotateCcw, Upload } from "lucide-react";

export default function AdminSplashPage() {
  const [videoPath, setVideoPath] = useState(DEFAULT_SPLASH_VIDEO_PATH);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/splash")
      .then((r) => r.json())
      .then((d) => {
        if (d.videoPath) setVideoPath(d.videoPath);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    const form = new FormData();
    form.append("video", file);

    try {
      const res = await fetch("/api/admin/splash", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "خطا در آپلود");
        return;
      }
      setVideoPath(data.videoPath);
      setMessage("ویدیو با موفقیت ذخیره شد.");
    } catch {
      setMessage("خطا در ارتباط با سرور");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleReset = async () => {
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/splash", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "خطا");
        return;
      }
      setVideoPath(data.videoPath);
      setMessage("به ویدیو پیش‌فرض بازگشت.");
    } catch {
      setMessage("خطا در ارتباط با سرور");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="اسپلش اسکرین"
        description="آپلود ویدیوی نمایش در ابتدای بازدید (یک‌بار در هر نشست)"
      />

      {loading ? (
        <AdminLoading />
      ) : (
        <AdminCard>
          <AdminCardHeader
            title="ویدیوی فعال"
            description="فایل در public/splash_screen ذخیره می‌شود"
          />
          <AdminCardBody className="space-y-4">
            <video
              key={videoPath}
              src={videoPath}
              controls
              className="max-h-64 w-full rounded-xl bg-black"
            />
            <p className="text-xs text-[var(--admin-text-subtle)]" dir="ltr">
              {videoPath}
            </p>

            <div className="flex flex-wrap gap-3">
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--admin-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--admin-primary-fg)]",
                  uploading && "pointer-events-none opacity-50"
                )}
              >
                <Upload className="size-3.5" />
                {uploading ? "در حال پردازش..." : "آپلود MP4"}
                <input
                  type="file"
                  accept="video/mp4,.mp4"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleUpload}
                />
              </label>
              <AdminButton variant="secondary" onClick={handleReset} disabled={uploading}>
                <RotateCcw className="size-3.5" />
                بازگشت به پیش‌فرض
              </AdminButton>
            </div>

            {message && (
              <p className="text-sm text-[var(--admin-text-muted)]">{message}</p>
            )}
          </AdminCardBody>
        </AdminCard>
      )}
    </AdminLayout>
  );
}
