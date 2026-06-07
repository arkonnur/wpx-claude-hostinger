import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { VERIFIED_DAYS, SESSION_DAYS } from "./jwt";

export const VERIFIED_COOKIE = "wpx_verified";
export const SESSION_COOKIE = "wpx_session";

const base = () => {
  const prod = process.env.NODE_ENV === "production";
  // Cross-origin SPA (different subdomain) needs SameSite=None; Secure to send cookies.
  // Same-origin deploy can override with COOKIE_SAMESITE=Lax.
  const sameSite =
    (process.env.COOKIE_SAMESITE as "Lax" | "None" | "Strict") ||
    (prod ? "None" : "Lax");
  return {
    httpOnly: true,
    secure: prod || sameSite === "None",
    sameSite,
    path: "/",
    domain: process.env.COOKIE_DOMAIN || undefined,
  } as const;
};

export function setVerifiedCookie(c: Context, token: string) {
  setCookie(c, VERIFIED_COOKIE, token, { ...base(), maxAge: VERIFIED_DAYS * 86400 });
}
export function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, { ...base(), maxAge: SESSION_DAYS * 86400 });
}
export function clearAuthCookies(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}
