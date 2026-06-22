"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminCard, AdminCardBody, AdminCardHeader } from "@/components/admin/ui/AdminCard";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminLoading } from "@/components/admin/ui/AdminLoading";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { formatPersianDateTime } from "@/lib/dates";
import { AUDIT_ACTOR_LABELS } from "@/lib/audit-labels";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Shield,
  User,
  Users,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AuditLog = {
  id: string;
  action: string;
  actionLabel: string;
  actorType: string;
  actorUserId: string | null;
  actorLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  summary: string | null;
  ip: string | null;
  metadata: unknown;
  createdAt: string;
};

type Stats = {
  todayCount: number;
  todayUserCount: number;
  byActor: { actorType: string; count: number }[];
};

const ACTOR_STYLES: Record<string, { dot: string; bg: string; icon: typeof Shield }> = {
  ADMIN: { dot: "bg-violet-400", bg: "bg-violet-500/10 text-violet-300", icon: Shield },
  USER: { dot: "bg-sky-400", bg: "bg-sky-500/10 text-sky-300", icon: User },
  SYSTEM: { dot: "bg-slate-400", bg: "bg-slate-500/10 text-slate-300", icon: Activity },
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [actorType, setActorType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(
    (search = q, actor = actorType, p = page) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (actor) params.set("actorType", actor);
      params.set("page", String(p));
      params.set("limit", "40");

      fetch(`/api/admin/audit-logs?${params}`)
        .then((r) => r.json())
        .then((d) => {
          setLogs(d.logs ?? []);
          setStats(d.stats ?? null);
          setTotalPages(d.pagination?.totalPages ?? 1);
        })
        .finally(() => setLoading(false));
    },
    [q, actorType, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const userToday = stats?.todayUserCount ?? 0;
  const totalToday = stats?.todayCount ?? 0;

  return (
    <AdminLayout>
      <AdminPageHeader
        title="لاگ و مانیتورینگ"
        description="ردیابی فعالیت کاربران و اقدامات ادمین به‌صورت زمانی"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminMetricCard
          label="رویدادهای امروز"
          value={totalToday}
          icon={ScrollText}
          accent="primary"
        />
        <AdminMetricCard label="فعالیت کاربران" value={userToday} icon={Users} accent="secondary" />
      </div>

      <AdminCard className="mb-4">
        <AdminCardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs text-[var(--admin-text-muted)]">جستجو</label>
              <AdminInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="خلاصه، نام، شناسه..."
                onKeyDown={(e) => e.key === "Enter" && (setPage(1), load(q, actorType, 1))}
              />
            </div>
            <div className="min-w-[140px]">
              <label className="mb-1 block text-xs text-[var(--admin-text-muted)]">نوع عامل</label>
              <select
                value={actorType}
                onChange={(e) => {
                  setActorType(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2.5 text-sm"
              >
                <option value="">همه</option>
                <option value="ADMIN">ادمین</option>
                <option value="USER">کاربر</option>
                <option value="SYSTEM">سیستم</option>
              </select>
            </div>
            <AdminButton
              onClick={() => {
                setPage(1);
                load(q, actorType, 1);
              }}
            >
              <Search className="size-4" />
              اعمال
            </AdminButton>
          </div>
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader
          title="خط زمانی رویدادها"
          description="جدیدترین رویدادها در بالا"
          action={
            <AdminBadge tone="default">
              <Filter className="size-3" />
              صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
            </AdminBadge>
          }
        />
        <AdminCardBody>
          {loading ? (
            <AdminLoading />
          ) : logs.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--admin-text-muted)]">
              رویدادی یافت نشد
            </p>
          ) : (
            <div className="relative space-y-0">
              <div className="absolute bottom-0 end-4 top-0 w-px bg-[var(--admin-border)]" />
              {logs.map((log) => {
                const style = ACTOR_STYLES[log.actorType] ?? ACTOR_STYLES.SYSTEM;
                const Icon = style.icon;
                const expanded = expandedId === log.id;
                return (
                  <div key={log.id} className="relative pe-8 pb-6">
                    <span
                      className={cn(
                        "absolute end-2.5 top-1.5 z-10 size-3 rounded-full ring-4 ring-[var(--admin-surface)]",
                        style.dot
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : log.id)}
                      className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] p-4 text-start transition-colors hover:border-[var(--admin-border-strong)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg",
                              style.bg
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{log.actionLabel}</p>
                              <AdminBadge tone="default" className="text-[10px]">
                                {AUDIT_ACTOR_LABELS[log.actorType] ?? log.actorType}
                              </AdminBadge>
                            </div>
                            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
                              {log.summary ?? "—"}
                            </p>
                            {log.actorLabel && (
                              <p className="mt-1 text-xs text-[var(--admin-text-subtle)]">
                                {log.actorLabel}
                                {log.actorUserId && (
                                  <Link
                                    href={`/admin/users/${log.actorUserId}`}
                                    className="me-2 text-[var(--admin-primary)] hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    مشاهده پروفایل
                                  </Link>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-end text-xs text-[var(--admin-text-subtle)]">
                          <p>{formatPersianDateTime(log.createdAt)}</p>
                          {log.ip && (
                            <p className="mt-0.5 font-mono" dir="ltr">
                              {log.ip}
                            </p>
                          )}
                        </div>
                      </div>
                      {expanded && (
                        <div className="mt-4 border-t border-[var(--admin-border)] pt-3 text-xs">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <p>
                              <span className="text-[var(--admin-text-subtle)]">Action: </span>
                              <span dir="ltr">{log.action}</span>
                            </p>
                            {log.entityType && (
                              <p>
                                <span className="text-[var(--admin-text-subtle)]">Entity: </span>
                                {log.entityType}
                                {log.entityId && (
                                  <span className="font-mono" dir="ltr">
                                    {" "}
                                    / {log.entityId}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          {log.metadata != null && (
                            <pre
                              className="mt-3 max-h-48 overflow-auto rounded-lg bg-[var(--admin-bg)] p-3 font-mono text-[10px] leading-relaxed text-[var(--admin-text-muted)]"
                              dir="ltr"
                            >
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 border-t border-[var(--admin-border)] pt-4">
              <AdminButton
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  load(q, actorType, p);
                }}
              >
                <ChevronRight className="size-4" />
              </AdminButton>
              <span className="text-sm tabular-nums text-[var(--admin-text-muted)]">
                {page.toLocaleString("fa-IR")} / {totalPages.toLocaleString("fa-IR")}
              </span>
              <AdminButton
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  load(q, actorType, p);
                }}
              >
                <ChevronLeft className="size-4" />
              </AdminButton>
            </div>
          )}
        </AdminCardBody>
      </AdminCard>
    </AdminLayout>
  );
}
