// Anti-spam wall — pure decision logic that runs BEFORE any OTP is sent, so we
// never spend an OTP/WhatsApp credit on junk. See MASTER_BUILD_SPEC §4.
import { normalizePhone } from "./crypto";

export interface OtpGuardSignals {
  phone: string;
  turnstileOk: boolean;
  honeypotFilled: boolean; // hidden field — bots fill it
  formFillMs: number; // time from form render to submit
  isBanned: boolean;
  otpSentLastHourForPhone: number;
  otpSentLastDayForIp: number;
  distinctPhonesForDeviceToday: number;
}

export interface GuardLimits {
  maxOtpPerPhonePerHour: number;
  maxOtpPerIpPerDay: number;
  maxPhonesPerDevicePerDay: number;
  minFormFillMs: number;
}

export const DEFAULT_LIMITS: GuardLimits = {
  maxOtpPerPhonePerHour: 3,
  maxOtpPerIpPerDay: 15,
  maxPhonesPerDevicePerDay: 4,
  minFormFillMs: 1500,
};

export type GuardResult = { ok: true } | { ok: false; code: string; reason: string };

// Disposable / known VoIP-ish helpers (structural; WhatsApp-exists is the real filter).
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
  "yopmail.com", "trashmail.com", "sharklasers.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function guardOtpSend(s: OtpGuardSignals, limits: GuardLimits = DEFAULT_LIMITS): GuardResult {
  if (s.isBanned) return { ok: false, code: "banned", reason: "Access temporarily blocked." };
  if (s.honeypotFilled) return { ok: false, code: "bot", reason: "Bot detected." };
  if (s.formFillMs < limits.minFormFillMs) return { ok: false, code: "too_fast", reason: "Submission too fast." };
  if (!s.turnstileOk) return { ok: false, code: "captcha", reason: "Verification failed. Retry." };
  if (!normalizePhone(s.phone)) return { ok: false, code: "bad_phone", reason: "Enter a valid Indian mobile number." };
  if (s.otpSentLastHourForPhone >= limits.maxOtpPerPhonePerHour)
    return { ok: false, code: "phone_rate", reason: "Too many attempts. Try again later." };
  if (s.otpSentLastDayForIp >= limits.maxOtpPerIpPerDay)
    return { ok: false, code: "ip_rate", reason: "Too many requests from your network." };
  if (s.distinctPhonesForDeviceToday >= limits.maxPhonesPerDevicePerDay)
    return { ok: false, code: "device_rate", reason: "Too many numbers from this device." };
  return { ok: true };
}

/** Escalating ban ladder (MASTER_BUILD_SPEC §6). Returns ms duration; null = permanent. */
export function banDurationMs(strikeCount: number): number | null {
  const DAY = 86_400_000;
  switch (strikeCount) {
    case 1: return 1 * DAY;
    case 2: return 3 * DAY;
    case 3: return 10 * DAY;
    default: return null; // 4+ → permanent
  }
}

/** Verify a Cloudflare Turnstile token server-side. */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // dev: no key configured → pass
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { success: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}
