import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const USER_SESSION_COOKIE = "user_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.USER_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("USER_SESSION_SECRET or ADMIN_SESSION_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createUserSessionToken(userId: string): string {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = `user:${userId}:${expires}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyUserSessionToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return null;
    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);
    const expected = sign(payload);
    if (signature.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

    const parts = payload.split(":");
    if (parts[0] !== "user" || !parts[1] || !parts[2]) return null;
    const userId = parts[1];
    const expires = Number(parts[2]);
    if (Number.isNaN(expires) || Date.now() >= expires) return null;
    return { userId };
  } catch {
    return null;
  }
}

export async function setUserSessionCookie(userId: string): Promise<void> {
  const token = createUserSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearUserSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_SESSION_COOKIE);
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyUserSessionToken(token)?.userId ?? null;
}

export async function requireUser(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new UserAuthError();
  return userId;
}

export class UserAuthError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UserAuthError";
  }
}

export function userUnauthorizedResponse() {
  return Response.json({ error: "لطفاً وارد حساب خود شوید." }, { status: 401 });
}
