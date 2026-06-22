import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { adminUnauthorizedResponse, requireAdmin } from "@/lib/auth-admin";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { computeUserScore, loadActivePointRulesMap } from "@/lib/user-score";
import { getReferralLink } from "@/lib/utils";
import { deleteUserByAdmin, updateUserByAdmin } from "@/lib/user-admin";
import { adminUserUpdateSchema } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [user, rules] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        include: {
          predictions: {
            include: {
              match: { include: { homeTeam: true, awayTeam: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          referralsMade: {
            include: {
              referred: { select: { firstName: true, lastName: true, phone: true, createdAt: true } },
            },
          },
          referredRecord: {
            include: {
              referrer: { select: { firstName: true, lastName: true, referralCode: true } },
            },
          },
          smsLogs: { orderBy: { createdAt: "desc" } },
          pointTransactions: { orderBy: { createdAt: "desc" } },
        },
      }),
      loadActivePointRulesMap(),
    ]);

    if (!user) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

    const computedScore = computeUserScore(
      {
        basePointsAwarded: user.basePointsAwarded,
        correctCount: user.correctCount,
        wrongCount: user.wrongCount,
        referralCount: user.referralCount,
      },
      rules
    );

    return NextResponse.json({
      user: {
        ...user,
        points: computedScore,
        correctCount: user.correctCount,
        wrongCount: user.wrongCount,
        referralLink: getReferralLink(user.referralCode),
      },
    });
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    }

    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

    try {
      const updated = await updateUserByAdmin(id, parsed.data);
      const ip = getClientIp(request);

      if (parsed.data.hidden !== undefined && parsed.data.hidden !== before.hidden) {
        await writeAuditLog(
          parsed.data.hidden ? "ADMIN_USER_HIDE" : "ADMIN_USER_UNHIDE",
          "User",
          id,
          { before: before.hidden, after: parsed.data.hidden },
          {
            summary: parsed.data.hidden
              ? `مخفی‌سازی ${before.firstName} ${before.lastName}`
              : `فعال‌سازی ${before.firstName} ${before.lastName}`,
            ip,
          }
        );
      } else {
        await writeAuditLog("ADMIN_USER_UPDATE", "User", id, parsed.data, {
          summary: `ویرایش کاربر ${updated.firstName} ${updated.lastName}`,
          ip,
        });
      }

      return NextResponse.json({ success: true, user: updated });
    } catch (e) {
      if (e instanceof Error && e.message === "INVALID_PHONE") {
        return NextResponse.json({ error: "شماره موبایل معتبر نیست" }, { status: 400 });
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ error: "این شماره موبایل قبلاً ثبت شده" }, { status: 409 });
      }
      throw e;
    }
  } catch {
    return adminUnauthorizedResponse();
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

    await deleteUserByAdmin(id);
    const ip = getClientIp(request);
    await writeAuditLog(
      "ADMIN_USER_DELETE",
      "User",
      id,
      {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        referralCode: user.referralCode,
      },
      {
        summary: `حذف کاربر ${user.firstName} ${user.lastName}`,
        ip,
      }
    );

    return NextResponse.json({ success: true });
  } catch {
    return adminUnauthorizedResponse();
  }
}
