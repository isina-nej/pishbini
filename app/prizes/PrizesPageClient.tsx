"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Gift,
  Target,
  Users,
  Star,
  Zap,
  Medal,
  Calendar,
  ChevronLeft,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { LoadingState } from "@/components/public/LoadingState";
import { ErrorState } from "@/components/public/ErrorState";
import type { CampaignInfoContent, CampaignInfoSectionIcon } from "@/lib/campaign-info";

const ICONS: Record<CampaignInfoSectionIcon, LucideIcon> = {
  trophy: Trophy,
  target: Target,
  users: Users,
  star: Star,
  gift: Gift,
  zap: Zap,
  medal: Medal,
  calendar: Calendar,
};

const ICON_COLORS: Record<CampaignInfoSectionIcon, string> = {
  trophy: "text-amber-400 bg-amber-400/15",
  target: "text-primary bg-primary/15",
  users: "text-secondary bg-secondary/15",
  star: "text-warning bg-warning/15",
  gift: "text-pink-400 bg-pink-400/15",
  zap: "text-yellow-300 bg-yellow-300/10",
  medal: "text-orange-400 bg-orange-400/15",
  calendar: "text-sky-400 bg-sky-400/15",
};

type PointRule = { key: string; label: string; points: number; description: string | null };

export function PrizesPageClient() {
  const [content, setContent] = useState<CampaignInfoContent | null>(null);
  const [pointRules, setPointRules] = useState<PointRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/campaign-info")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        if (!data.published) {
          setError("این صفحه در حال حاضر غیرفعال است.");
          return;
        }
        setContent(data.content);
        setPointRules(data.pointRules ?? []);
      })
      .catch(() => setError("خطا در بارگذاری اطلاعات"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!content) return null;

  return (
    <div className="pb-24 pt-4">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-4 mb-6 overflow-hidden rounded-3xl border border-white/10 p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/25 via-transparent to-primary/20" />
        <div className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-[#10111f] shadow-lg shadow-amber-500/20">
            <Gift className="size-6" />
          </div>
          <h1 className="text-2xl font-bold">{content.heroTitle}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/65">{content.heroSubtitle}</p>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass-card mx-4 mb-5 overflow-hidden p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="size-5 text-amber-400" />
          <h2 className="font-bold">{content.prizeTitle}</h2>
        </div>
        <p className="text-sm leading-relaxed text-white/70">{content.prizeDescription}</p>
        <ul className="mt-4 space-y-2">
          {content.prizeItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/80">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mx-4 mb-5"
      >
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Zap className="size-5 text-warning" />
          {content.scoringTitle}
        </h2>
        <p className="mb-4 text-sm text-white/55">{content.scoringIntro}</p>
        <div className="grid gap-2">
          {pointRules.map((rule) => (
            <div
              key={rule.key}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{rule.label}</p>
                {rule.description && (
                  <p className="mt-0.5 text-[11px] text-white/45">{rule.description}</p>
                )}
              </div>
              <span className="rounded-lg bg-primary/15 px-3 py-1 text-sm font-bold text-primary">
                {rule.points > 0 ? "+" : ""}
                {rule.points.toLocaleString("fa-IR")}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="mx-4 mb-5 space-y-3">
        {content.sections.map((section, i) => {
          const Icon = ICONS[section.icon];
          const color = ICON_COLORS[section.icon];
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="glass-card flex gap-4 p-4"
            >
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">{section.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{section.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {content.footnote && (
        <p className="mx-4 mb-6 text-center text-[11px] leading-relaxed text-white/35">
          {content.footnote}
        </p>
      )}

      <div className="mx-4">
        <Link
          href="/leaderboard"
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 text-sm font-bold text-[#10111f]"
        >
          <Trophy className="size-4" />
          مشاهده جدول امتیازات
          <ChevronLeft className="size-4" />
        </Link>
      </div>
    </div>
  );
}
