import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, hashPhone } from "./crypto.ts";
import { guardOtpSend, DEFAULT_LIMITS, banDurationMs, isDisposableEmail } from "./antispam.ts";
import { generateOtp, hashOtp, isExpired } from "./otp.ts";

test("normalizePhone accepts valid Indian mobiles, rejects junk", () => {
  assert.equal(normalizePhone("9876543210"), "+919876543210");
  assert.equal(normalizePhone("+91 98765 43210"), "+919876543210");
  assert.equal(normalizePhone("0098765 43210"), null); // wrong shape
  assert.equal(normalizePhone("1234567890"), null); // not 6-9 series
  assert.equal(normalizePhone("123"), null);
});

test("hashPhone is deterministic + non-reversible", () => {
  const a = hashPhone("+919876543210");
  const b = hashPhone("+919876543210");
  assert.equal(a, b);
  assert.notEqual(a, "+919876543210");
  assert.equal(a.length, 64);
});

test("guardOtpSend blocks bots/rate before spending OTP", () => {
  const ok = guardOtpSend({
    phone: "+919876543210", turnstileOk: true, honeypotFilled: false, formFillMs: 4000,
    isBanned: false, otpSentLastHourForPhone: 0, otpSentLastDayForIp: 0, distinctPhonesForDeviceToday: 0,
  });
  assert.equal(ok.ok, true);

  const bot = guardOtpSend({
    phone: "+919876543210", turnstileOk: true, honeypotFilled: true, formFillMs: 4000,
    isBanned: false, otpSentLastHourForPhone: 0, otpSentLastDayForIp: 0, distinctPhonesForDeviceToday: 0,
  });
  assert.equal(bot.ok, false);

  const rate = guardOtpSend({
    phone: "+919876543210", turnstileOk: true, honeypotFilled: false, formFillMs: 4000,
    isBanned: false, otpSentLastHourForPhone: DEFAULT_LIMITS.maxOtpPerPhonePerHour, otpSentLastDayForIp: 0, distinctPhonesForDeviceToday: 0,
  });
  assert.equal(rate.ok, false);
  if (!rate.ok) assert.equal(rate.code, "phone_rate");
});

test("ban ladder escalates 1d→3d→10d→permanent", () => {
  const DAY = 86_400_000;
  assert.equal(banDurationMs(1), 1 * DAY);
  assert.equal(banDurationMs(2), 3 * DAY);
  assert.equal(banDurationMs(3), 10 * DAY);
  assert.equal(banDurationMs(4), null);
  assert.equal(banDurationMs(9), null);
});

test("disposable email blocked", () => {
  assert.equal(isDisposableEmail("a@mailinator.com"), true);
  assert.equal(isDisposableEmail("real@gmail.com"), false);
});

test("otp hashing matches, expiry works", () => {
  const ph = hashPhone("+919876543210");
  const code = generateOtp();
  assert.equal(code.length, 6);
  assert.equal(hashOtp(ph, code), hashOtp(ph, code));
  assert.notEqual(hashOtp(ph, code), hashOtp(ph, "000000"));
  assert.equal(isExpired(Date.now()), false);
  assert.equal(isExpired(Date.now() - 10 * 60 * 1000), true);
});
