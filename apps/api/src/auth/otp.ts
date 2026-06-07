// OTP generation/verification primitives (pure). Storage handled by repo.
import { createHash, randomInt } from "node:crypto";

export const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(phoneHash: string, code: string): string {
  return createHash("sha256").update(`${phoneHash}:${code}`).digest("hex");
}

export function isExpired(issuedAtMs: number, now = Date.now()): boolean {
  return now - issuedAtMs > OTP_TTL_MS;
}
