import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId, setUserSessionCookie } from "@/lib/auth-user";
import { normalizeReferralCode } from "@/lib/referral";

export const PARTICIPANT_COOKIE = "wc_participant";

/** Read-only — safe in Server Components and Route Handlers. */
export async function resolveUserIdFromCookies(): Promise<string | null> {
  const sessionUserId = await getAuthenticatedUserId();
  if (sessionUserId) return sessionUserId;

  const cookieStore = await cookies();
  const referralCode = cookieStore.get(PARTICIPANT_COOKIE)?.value;
  if (!referralCode) return null;

  const normalized = normalizeReferralCode(referralCode);
  if (!normalized) return null;

  const user = await prisma.user.findFirst({
    where: { referralCode: normalized },
    select: { id: true },
  });

  return user?.id ?? null;
}

/** Route Handlers only — upgrades participant cookie to session and refreshes expiry. */
export async function resolveUserIdInRouteHandler(): Promise<string | null> {
  const userId = await resolveUserIdFromCookies();
  if (!userId) return null;
  await setUserSessionCookie(userId);
  return userId;
}

export async function resolveUserIdOrThrow(): Promise<string> {
  const userId = await resolveUserIdFromCookies();
  if (!userId) throw new MeUserError();
  return userId;
}

export async function resolveUserIdOrThrowInRouteHandler(): Promise<string> {
  const userId = await resolveUserIdInRouteHandler();
  if (!userId) throw new MeUserError();
  return userId;
}

export class MeUserError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "MeUserError";
  }
}

export function meUnauthorizedResponse() {
  return Response.json({ error: "لطفاً وارد حساب خود شوید." }, { status: 401 });
}
