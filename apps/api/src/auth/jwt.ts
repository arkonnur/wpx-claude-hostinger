// JWT sign/verify for the two trust cookies. Uses hono/jwt (Web Crypto HS256) —
// no extra dependency. See MASTER_BUILD_SPEC §4.
import { sign, verify } from "hono/jwt";
import type { VerifiedClaims, SessionClaims } from "@wpx/types";

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET not set — refusing to sign/verify tokens");
  return s;
};
const days = (n: number) => Math.floor(Date.now() / 1000) + n * 86400;

export const VERIFIED_DAYS = Number(process.env.VERIFIED_COOKIE_DAYS ?? 90);
export const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 7);

export async function signVerified(claims: VerifiedClaims): Promise<string> {
  return sign({ ...claims, exp: days(VERIFIED_DAYS) }, secret(), "HS256");
}
export async function signSession(claims: SessionClaims): Promise<string> {
  return sign({ ...claims, exp: days(SESSION_DAYS) }, secret(), "HS256");
}

export async function readVerified(token?: string): Promise<VerifiedClaims | null> {
  if (!token) return null;
  try {
    return (await verify(token, secret(), "HS256")) as unknown as VerifiedClaims;
  } catch {
    return null;
  }
}
export async function readSession(token?: string): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    return (await verify(token, secret(), "HS256")) as unknown as SessionClaims;
  } catch {
    return null;
  }
}
