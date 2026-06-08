import { Hono } from "hono";
import {
  normalizePhone, hashPhone, hashPassword, verifyPassword,
} from "./crypto";
import { generateOtp, hashOtp, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from "./otp";
import { guardOtpSend, verifyTurnstile, isDisposableEmail } from "./antispam";
import { signVerified, signSession } from "./jwt";
import { setVerifiedCookie, setSessionCookie, clearAuthCookies } from "./cookies";
import { getOtpProvider } from "./whatsapp";
import { clientIp, deviceId, getSession, getVerified } from "./guards";
import * as repo from "./repo";

export const authRoutes = new Hono();

/**
 * Smart routing: tell the client whether a number is new (→ OTP+signup),
 * returning-with-account (→ login, ZERO OTP), or verified-without-password
 * (→ set password). This is what saves OTP cost. MASTER_BUILD_SPEC §4.
 */
authRoutes.post("/check", async (c) => {
  const { phone } = await c.req.json<{ phone: string }>();
  const e164 = normalizePhone(phone);
  if (!e164) return c.json({ error: "bad_phone" }, 400);
  const ban = await repo.activeBan(clientIp(c), deviceId(c));
  if (ban) return c.json({ error: "banned", until: ban.expiresAt }, 403);

  const reg = await repo.getRegistry(hashPhone(e164));
  if (reg?.hasAccount) return c.json({ route: "login" });
  if (reg?.verifiedAt) return c.json({ route: "set_password" }); // verified before, no pw yet
  return c.json({ route: "otp" }); // new number
});

/** Send OTP — only after the anti-spam wall passes (so no wasted credits). */
authRoutes.post("/otp/send", async (c) => {
  const body = await c.req.json<{ phone: string; turnstileToken?: string; honeypot?: string; formFillMs?: number }>();
  const e164 = normalizePhone(body.phone);
  if (!e164) return c.json({ error: "bad_phone" }, 400);
  const ip = clientIp(c);
  const dev = deviceId(c);
  const phoneHash = hashPhone(e164);

  const ban = await repo.activeBan(ip, dev);
  const turnstileOk = await verifyTurnstile(body.turnstileToken ?? "", ip);
  const decision = guardOtpSend({
    phone: e164,
    turnstileOk,
    honeypotFilled: !!body.honeypot,
    formFillMs: body.formFillMs ?? 9999,
    isBanned: !!ban,
    otpSentLastHourForPhone: await repo.countOtpForPhoneLastHour(phoneHash),
    otpSentLastDayForIp: await repo.countOtpForIpLastDay(ip),
    distinctPhonesForDeviceToday: await repo.countPhonesForDeviceToday(dev),
  });
  if (!decision.ok) {
    await repo.logOtp("blocked", phoneHash, ip, dev);
    return c.json({ error: decision.code, reason: decision.reason }, 429);
  }

  const wa = getOtpProvider();
  if (!(await wa.hasWhatsApp(e164))) {
    await repo.logOtp("blocked", phoneHash, ip, dev);
    return c.json({ error: "no_whatsapp", reason: "This number has no WhatsApp." }, 400);
  }

  const code = generateOtp();
  await repo.storeChallenge(phoneHash, hashOtp(phoneHash, code), new Date(Date.now() + OTP_TTL_MS));
  await wa.sendOtp(e164, code);
  await repo.logOtp("sent", phoneHash, ip, dev);
  return c.json({ ok: true, ttlMs: OTP_TTL_MS });
});

/** Verify OTP → issue wpx_verified cookie + trust device. Tools now unlocked. */
authRoutes.post("/otp/verify", async (c) => {
  const { phone, code } = await c.req.json<{ phone: string; code: string }>();
  const e164 = normalizePhone(phone);
  if (!e164) return c.json({ error: "bad_phone" }, 400);
  const ip = clientIp(c);
  const dev = deviceId(c);
  const phoneHash = hashPhone(e164);

  const ch = await repo.activeChallenge(phoneHash);
  if (!ch) return c.json({ error: "no_challenge" }, 400);
  if (ch.attempts >= OTP_MAX_ATTEMPTS) return c.json({ error: "too_many_attempts" }, 429);
  if (new Date(ch.expiresAt).getTime() < Date.now()) return c.json({ error: "expired" }, 400);

  if (hashOtp(phoneHash, code) !== ch.codeHash) {
    await repo.bumpAttempt(ch.id);
    await repo.logOtp("failed", phoneHash, ip, dev);
    return c.json({ error: "wrong_code" }, 400);
  }

  await repo.consumeChallenge(ch.id);
  await repo.markVerified(phoneHash);
  await repo.logOtp("verified", phoneHash, ip, dev);

  const tenantId = await repo.getDefaultTenantId();
  const contact = await repo.getOrCreateContact(tenantId, e164, phoneHash);
  await repo.trustDevice(contact.id, dev);

  const token = await signVerified({ contactId: contact.id, phoneHash, scope: "tools", verifiedAt: Date.now() });
  setVerifiedCookie(c, token);

  const reg = await repo.getRegistry(phoneHash);
  return c.json({ verified: true, hasAccount: !!reg?.hasAccount, contactId: contact.id });
});

/** Create account (email+password) — requires the verified cookie for this phone. */
authRoutes.post("/register", async (c) => {
  const body = await c.req.json<{ email: string; password: string; name?: string; phone: string }>();
  const v = await getVerified(c);
  const e164 = normalizePhone(body.phone);
  if (!e164) return c.json({ error: "bad_phone" }, 400);
  if (!v || v.phoneHash !== hashPhone(e164)) return c.json({ error: "verification_required" }, 401);
  if (!body.email || !body.password || body.password.length < 8) return c.json({ error: "weak_credentials" }, 400);
  if (isDisposableEmail(body.email)) return c.json({ error: "disposable_email" }, 400);
  if (await repo.findUserByEmail(body.email)) return c.json({ error: "email_taken" }, 409);

  const tenantId = await repo.getDefaultTenantId();
  const phoneHash = hashPhone(e164);
  const contact = await repo.getOrCreateContact(tenantId, e164, phoneHash);
  const user = await repo.createUser({
    email: body.email, passwordHash: await hashPassword(body.password), name: body.name, phone: e164, contactId: contact.id,
  });
  await repo.ensureMembership(user.id, tenantId, "client");
  await repo.markHasAccount(phoneHash);

  const token = await signSession({ userId: user.id, contactId: contact.id, tenantId, role: "client" });
  setSessionCookie(c, token);
  return c.json({ ok: true, role: "client" });
});

/**
 * Reset password — requires a fresh verified-phone cookie (proves OTP ownership)
 * AND that the phone matches the account's email. No SMTP needed: identity is
 * proven by the SMS OTP the client just completed. Logs the user in on success.
 */
authRoutes.post("/reset-password", async (c) => {
  const body = await c.req.json<{ email: string; phone: string; password: string }>();
  const e164 = normalizePhone(body.phone);
  if (!e164) return c.json({ error: "bad_phone" }, 400);
  if (!body.password || body.password.length < 8) return c.json({ error: "weak_password" }, 400);

  const v = await getVerified(c);
  if (!v || v.phoneHash !== hashPhone(e164)) return c.json({ error: "verification_required" }, 401);

  const user = await repo.findUserByEmail(body.email);
  // Generic failure: do not reveal whether the email exists or the phone differs.
  if (!user || user.phone !== e164) return c.json({ error: "reset_failed" }, 400);

  await repo.setUserPassword(user.id, await hashPassword(body.password));
  const m = await repo.primaryMembership(user.id);
  if (!m) return c.json({ error: "no_membership" }, 403);
  const token = await signSession({ userId: user.id, contactId: user.contactId ?? "", tenantId: m.tenantId, role: m.role });
  setSessionCookie(c, token);
  return c.json({ ok: true, role: m.role });
});

/**
 * Login (email+password). OTP is required only as step-up: if the verified
 * cookie is valid for this account's phone, skip it; else respond needs_otp.
 */
authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const user = await repo.findUserByEmail(email);
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: "invalid_credentials" }, 401);
  }
  const phoneHash = user.phone ? hashPhone(user.phone) : null;
  const v = await getVerified(c);
  const verifiedThisPhone = !!v && !!phoneHash && v.phoneHash === phoneHash;
  if (!verifiedThisPhone) {
    // step-up required (new device / expired). Client should run /otp/send+verify then retry.
    return c.json({ needs_otp: true, phone: user.phone });
  }
  const m = await repo.primaryMembership(user.id);
  if (!m) return c.json({ error: "no_membership" }, 403);
  const token = await signSession({ userId: user.id, contactId: user.contactId ?? "", tenantId: m.tenantId, role: m.role });
  setSessionCookie(c, token);
  return c.json({ ok: true, role: m.role });
});

authRoutes.get("/me", async (c) => {
  const s = await getSession(c);
  const v = await getVerified(c);
  let user: { name: string | null; email: string | null } | null = null;
  if (s) {
    const u = await repo.findUserById(s.userId);
    if (u) user = { name: u.name ?? null, email: u.email ?? null };
  }
  return c.json({ session: s, user, verified: v ? { contactId: v.contactId, scope: v.scope } : null });
});

authRoutes.post("/logout", (c) => {
  clearAuthCookies(c);
  return c.json({ ok: true });
});
