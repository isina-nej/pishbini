/** Edge-safe session checks for middleware (expiry + format). HMAC verified in API routes. */

export function isAdminSessionTokenPlausible(token: string): boolean {
  try {
    const decoded = decodeBase64Url(token);
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return false;
    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);
    if (!payload.startsWith("admin:") || !signature || signature.length < 32) return false;
    const [, expiresStr] = payload.split(":");
    const expires = Number(expiresStr);
    return !Number.isNaN(expires) && Date.now() < expires;
  } catch {
    return false;
  }
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}
