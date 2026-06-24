"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PredictionChoice } from "@/generated/prisma";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput, AdminLabel, AdminSelect } from "@/components/admin/ui/AdminInput";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { formatPersianDateTime } from "@/lib/dates";
import { isScoreOutcomeMismatch } from "@/lib/match-result-utils";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

type Team = { id: string; nameFa: string; code: string };

type ResultMatch = {
  id: string;
  startTime: string;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
  predictionsCount: number;
  correctPrediction: PredictionChoice | null;
  homeScore: number | null;
  awayScore: number | null;
  settledAt: string | null;
  resultUpdatedAt: string | null;
  settlementPushScheduledAt: string | null;
  settlementPushSentAt: string | null;
};

type FormState = {
  correctPrediction: PredictionChoice;
  homeScore: string;
  awayScore: string;
};

const OUTCOME_OPTIONS: { value: PredictionChoice; label: string }[] = [
  { value: PredictionChoice.HOME_WIN, label: "برد میزبان" },
  { value: PredictionChoice.DRAW, label: "مساوی" },
  { value: PredictionChoice.AWAY_WIN, label: "برد میهمان" },
];

function emptyForm(match?: ResultMatch): FormState {
  return {
    correctPrediction: match?.correctPrediction ?? PredictionChoice.HOME_WIN,
    homeScore: match?.homeScore !== null && match?.homeScore !== undefined ? String(match.homeScore) : "",
    awayScore: match?.awayScore !== null && match?.awayScore !== undefined ? String(match.awayScore) : "",
  };
}

function parseOptionalScore(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function pushStatusLabel(match: ResultMatch, serverNow: string): string {
  if (!match.settledAt) return "ثبت نشده";
  if (match.settlementPushSentAt) return "اعلان ارسال شد";
  if (!match.settlementPushScheduledAt) return "در صف اعلان";
  const remainingMs =
    new Date(match.settlementPushScheduledAt).getTime() - new Date(serverNow).getTime();
  if (remainingMs <= 0) return "اعلان در صف ارسال";
  const minutes = Math.ceil(remainingMs / 60000);
  return `اعلان تا ${minutes.toLocaleString("fa-IR")} دقیقه دیگر`;
}

function ResultRow({
  match,
  serverNow,
  onSaved,
}: {
  match: ResultMatch;
  serverNow: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(match));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(emptyForm(match));
    setError(null);
    setWarning(null);
    setSaved(false);
  }, [match]);

  const homeScore = parseOptionalScore(form.homeScore);
  const awayScore = parseOptionalScore(form.awayScore);

  const scoreWarning = useMemo(() => {
    if (homeScore === null || awayScore === null) return null;
    if (form.homeScore.trim() && parseOptionalScore(form.homeScore) === null) {
      return "گل میزبان باید عدد صحیح نامنفی باشد.";
    }
    if (form.awayScore.trim() && parseOptionalScore(form.awayScore) === null) {
      return "گل میهمان باید عدد صحیح نامنفی باشد.";
    }
    if (isScoreOutcomeMismatch(form.correctPrediction, homeScore, awayScore)) {
      return "گل‌های واردشده با نتیجه انتخاب‌شده هم‌خوانی ندارند.";
    }
    return null;
  }, [form, homeScore, awayScore]);

  const handleSave = async () => {
    setError(null);
    setWarning(null);
    setSaved(false);

    if (form.homeScore.trim() && homeScore === null) {
      setError("گل میزبان نامعتبر است.");
      return;
    }
    if (form.awayScore.trim() && awayScore === null) {
      setError("گل میهمان نامعتبر است.");
      return;
    }

    if (!confirm("نتیجه ذخیره و امتیازها بلافاصله محاسبه می‌شوند. اعلان پوش ۱۰ دقیقه بعد ارسال می‌شود.")) {
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/results/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctPrediction: form.correctPrediction,
          homeScore,
          awayScore,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ذخیره");
        return;
      }
      if (data.scoreWarning) setWarning(data.scoreWarning);
      else if (scoreWarning) setWarning(scoreWarning);
      setSaved(true);
      onSaved();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  };

  const pending = !match.settledAt;

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--admin-border)] p-4",
        pending ? "bg-[var(--admin-surface)]" : "bg-[var(--admin-surface-elevated)]/40"
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {match.homeTeam.nameFa}
            <span className="mx-1.5 text-[var(--admin-text-subtle)]">vs</span>
            {match.awayTeam.nameFa}
          </p>
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
            {formatPersianDateTime(match.startTime)}
            <span className="mx-1.5">·</span>
            {match.predictionsCount.toLocaleString("fa-IR")} پیش‌بینی
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--admin-text-muted)]">
          {match.settlementPushSentAt ? (
            <CheckCircle2 className="size-3.5 text-[var(--admin-success)]" />
          ) : (
            <Clock className="size-3.5" />
          )}
          {pushStatusLabel(match, serverNow)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <AdminLabel>نتیجه بازی *</AdminLabel>
          <AdminSelect
            value={form.correctPrediction}
            onChange={(e) =>
              setForm({ ...form, correctPrediction: e.target.value as PredictionChoice })
            }
          >
            {OUTCOME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </AdminSelect>
        </div>
        <div>
          <AdminLabel>گل میزبان</AdminLabel>
          <AdminInput
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="—"
            dir="ltr"
            value={form.homeScore}
            onChange={(e) => setForm({ ...form, homeScore: e.target.value })}
          />
        </div>
        <div>
          <AdminLabel>گل میهمان</AdminLabel>
          <AdminInput
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="—"
            dir="ltr"
            value={form.awayScore}
            onChange={(e) => setForm({ ...form, awayScore: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <AdminButton onClick={handleSave} disabled={busy} className="w-full">
            {busy ? "..." : match.settledAt ? "ذخیره تغییرات" : "ثبت نتیجه"}
          </AdminButton>
        </div>
      </div>

      {scoreWarning && !error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="size-3.5 shrink-0" />
          {scoreWarning}
        </p>
      )}
      {warning && !error && (
        <p className="mt-2 text-xs text-amber-600">{warning}</p>
      )}
      {error && <p className="mt-2 text-xs text-[var(--admin-danger)]">{error}</p>}
      {saved && !error && (
        <p className="mt-2 text-xs text-[var(--admin-success)]">ذخیره شد.</p>
      )}
    </div>
  );
}

export default function AdminResultsPage() {
  const [matches, setMatches] = useState<ResultMatch[]>([]);
  const [serverNow, setServerNow] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "settled">("pending");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/results");
    const data = await res.json();
    setMatches(data.matches ?? []);
    setServerNow(data.serverNow ?? new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = matches.filter((m) => !m.settledAt);
  const settled = matches.filter((m) => m.settledAt);
  const visible = tab === "pending" ? pending : settled;

  return (
    <AdminLayout>
      <AdminPageHeader
        title="ثبت نتایج"
        description="ثبت و ویرایش نتیجه بازی‌های تمام‌شده — امتیاز فوری، اعلان با تأخیر ۱۰ دقیقه"
      />

      <div className="mb-4 flex gap-2">
        <AdminButton
          variant={tab === "pending" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("pending")}
        >
          منتظر ثبت ({pending.length.toLocaleString("fa-IR")})
        </AdminButton>
        <AdminButton
          variant={tab === "settled" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("settled")}
        >
          ثبت‌شده ({settled.length.toLocaleString("fa-IR")})
        </AdminButton>
      </div>

      <AdminCard>
        <AdminCardHeader
          title={tab === "pending" ? "بازی‌های منتظر ثبت نتیجه" : "بازی‌های ثبت‌شده"}
          description={
            tab === "pending"
              ? "بازی‌هایی که زمان شروعشان گذشته و هنوز نتیجه ندارند"
              : "قابل ویرایش — هر ذخیره، تایمر اعلان را ۱۰ دقیقه ریست می‌کند"
          }
        />
        <AdminCardBody className="space-y-3">
          {loading ? (
            <AdminLoading />
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--admin-text-muted)]">
              {tab === "pending" ? "بازی منتظر ثبت نتیجه نیست." : "هنوز نتیجه‌ای ثبت نشده."}
            </p>
          ) : (
            visible.map((m) => (
              <ResultRow key={m.id} match={m} serverNow={serverNow} onSaved={load} />
            ))
          )}
        </AdminCardBody>
      </AdminCard>
    </AdminLayout>
  );
}
