import type { Context, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { Role, SessionClaims, VerifiedClaims } from "@wpx/types";
import { readSession, readVerified } from "./jwt";
import { VERIFIED_COOKIE, SESSION_COOKIE } from "./cookies";

export function clientIp(c: Context): string {
  return (
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}
export function deviceId(c: Context): string {
  return c.req.header("x-device-id") || "unknown";
}

export async function getSession(c: Context): Promise<SessionClaims | null> {
  return readSession(getCookie(c, SESSION_COOKIE));
}
export async function getVerified(c: Context): Promise<VerifiedClaims | null> {
  return readVerified(getCookie(c, VERIFIED_COOKIE));
}

/** Require a valid dashboard session; optionally restrict to roles. */
export function requireRole(...roles: Role[]): MiddlewareHandler {
  return async (c, next) => {
    const s = await getSession(c);
    if (!s) return c.json({ error: "unauthenticated" }, 401);
    if (roles.length && !roles.includes(s.role)) return c.json({ error: "forbidden" }, 403);
    c.set("session", s);
    await next();
  };
}

/** Require a verified-visitor cookie (gated tools). */
export const requireVerified: MiddlewareHandler = async (c, next) => {
  const v = await getVerified(c);
  if (!v) return c.json({ error: "verification_required" }, 401);
  c.set("verified", v);
  await next();
};
