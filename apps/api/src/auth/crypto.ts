// Crypto helpers — phone hashing (identity anchor), password hashing, tokens.
import { createHmac, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

// Phone-hash HMAC key. Defaults to JWT_SECRET to preserve existing hashes;
// set PHONE_HASH_SALT to rotate independently (invalidates prior phoneHashes).
const PHONE_SALT = () => {
  const s = process.env.PHONE_HASH_SALT || process.env.JWT_SECRET;
  if (!s) throw new Error("PHONE_HASH_SALT/JWT_SECRET not set — refusing to hash phones");
  return s;
};

/** Normalize an Indian mobile to E.164 (+91XXXXXXXXXX). Returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  let n = digits;
  if (n.length === 10) n = "91" + n; // bare 10-digit
  if (n.length === 12 && n.startsWith("91")) {
    const local = n.slice(2);
    if (/^[6-9]\d{9}$/.test(local)) return "+" + n; // valid Indian mobile series
  }
  return null;
}

/** Deterministic, non-reversible phone identity key. Same number → same hash. */
export function hashPhone(phoneE164: string): string {
  return createHmac("sha256", PHONE_SALT()).update(phoneE164).digest("hex");
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/** Opaque refresh token + its storable hash. */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: createHash("sha256").update(token).digest("hex") };
}
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
