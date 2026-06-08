// Tabbed auth. Sign in = email+password (one-time OTP step-up on new device).
// Create account = email+password+confirm+mobile → OTP verify → register.
// Phone stays the security/identity anchor (contacts keyed by phoneHash).
import { useRef, useState } from "react";
import { X, Loader2, ShieldCheck } from "lucide-react";
import { ApiError } from "../lib/api";
import { sendOtp, verifyOtp, register, login, resetPassword } from "../lib/auth";
import { useSession } from "../lib/session";

type Mode = "signin" | "signup" | "reset";
type Sub = "form" | "otp" | "newpass";

export function AuthDialog({ onClose }: { onClose: () => void }) {
  const { refresh } = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [sub, setSub] = useState<Sub>("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const honeypot = useRef("");
  const renderedAt = useRef(Date.now());

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    await refresh();
    onClose();
  };

  // ---- Sign in ----
  const submitSignin = () =>
    run(async () => {
      if (!email || !password) throw new Error("Enter email and password.");
      const res = await login(email, password);
      if (res.needs_otp) {
        // New device / expired trust → one-time OTP step-up.
        const p = res.phone ?? phone;
        setPhone(p);
        await sendOtp(p, { formFillMs: 9999 });
        setSub("otp");
        return;
      }
      await finish();
    });

  const submitSigninOtp = () =>
    run(async () => {
      await verifyOtp(phone, code);
      // verified cookie now set for this phone → retry login, no more step-up.
      const res = await login(email, password);
      if (res.needs_otp) throw new Error("Verification failed — try again.");
      await finish();
    });

  // ---- Create account ----
  const submitSignup = () =>
    run(async () => {
      if (!email) throw new Error("Enter your email.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirm) throw new Error("Passwords do not match.");
      if (!phone) throw new Error("Enter your mobile number.");
      await sendOtp(phone, { honeypot: honeypot.current, formFillMs: Date.now() - renderedAt.current });
      setSub("otp");
    });

  const submitSignupOtp = () =>
    run(async () => {
      const { hasAccount } = await verifyOtp(phone, code);
      if (hasAccount) {
        // This number already owns an account — send them to sign in.
        setMode("signin");
        setSub("form");
        setCode("");
        setErr("This mobile already has an account — please sign in.");
        return;
      }
      await register({ phone, email, password, name: name || undefined });
      await finish();
    });

  // ---- Forgot / reset password ----
  const submitReset = () =>
    run(async () => {
      if (!email) throw new Error("Enter your email.");
      if (!phone) throw new Error("Enter your registered mobile number.");
      await sendOtp(phone, { honeypot: honeypot.current, formFillMs: Date.now() - renderedAt.current });
      setSub("otp");
    });

  const submitResetOtp = () =>
    run(async () => {
      await verifyOtp(phone, code); // proves phone ownership → verified cookie
      setSub("newpass");
    });

  const submitNewPassword = () =>
    run(async () => {
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirm) throw new Error("Passwords do not match.");
      await resetPassword({ email, phone, password });
      await finish();
    });

  const switchMode = (m: Mode) => {
    setMode(m);
    setSub("form");
    setCode("");
    setErr("");
  };

  const field = "w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400";
  const primary = "w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2";
  const tab = (active: boolean) =>
    `flex-1 py-2 text-sm font-semibold rounded-lg transition ${active ? "bg-white/10 text-white" : "text-white/45 hover:text-white/70"}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b1530] p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center">
          <ShieldCheck size={18} className="text-blue-400" />
          <span className="ml-2 font-bold">Secure access</span>
          <button onClick={onClose} className="ml-auto text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* honeypot — hidden from humans, bots fill it */}
        <input
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => (honeypot.current = e.target.value)}
          style={{ position: "absolute", left: "-9999px" }}
          aria-hidden
        />

        {sub === "form" && mode !== "reset" && (
          <div className="flex gap-1 rounded-xl bg-white/5 p-1">
            <button className={tab(mode === "signin")} onClick={() => switchMode("signin")}>Sign in</button>
            <button className={tab(mode === "signup")} onClick={() => switchMode("signup")}>Create account</button>
          </div>
        )}

        {/* ---- SIGN IN ---- */}
        {mode === "signin" && sub === "form" && (
          <>
            <input className={field} placeholder="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={field} placeholder="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className={primary} disabled={busy} onClick={submitSignin}>
              {busy && <Loader2 size={15} className="animate-spin" />} Sign in
            </button>
            <button onClick={() => switchMode("reset")} className="w-full text-center text-[12px] text-blue-300 hover:text-blue-200">
              Forgot password?
            </button>
          </>
        )}

        {mode === "signin" && sub === "otp" && (
          <>
            <p className="text-sm text-white/60">One-time security check. Enter the 6-digit code sent to {phone}.</p>
            <input className={field} placeholder="······" maxLength={6} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className={primary} disabled={busy} onClick={submitSigninOtp}>
              {busy && <Loader2 size={15} className="animate-spin" />} Verify & sign in
            </button>
          </>
        )}

        {/* ---- CREATE ACCOUNT ---- */}
        {mode === "signup" && sub === "form" && (
          <>
            <input className={field} placeholder="Full name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={field} placeholder="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={field} placeholder="Password (min 8 chars)" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className={field} placeholder="Re-enter password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <input className={field} placeholder="Mobile number (10-digit)" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className={primary} disabled={busy} onClick={submitSignup}>
              {busy && <Loader2 size={15} className="animate-spin" />} Get OTP
            </button>
          </>
        )}

        {mode === "signup" && sub === "otp" && (
          <>
            <p className="text-sm text-white/60">Enter the 6-digit code sent to {phone} to finish sign-up.</p>
            <input className={field} placeholder="······" maxLength={6} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className={primary} disabled={busy} onClick={submitSignupOtp}>
              {busy && <Loader2 size={15} className="animate-spin" />} Verify & create account
            </button>
          </>
        )}

        {/* ---- RESET PASSWORD ---- */}
        {mode === "reset" && sub === "form" && (
          <>
            <p className="text-sm text-white/60">Reset your password — we’ll send an OTP to your registered mobile.</p>
            <input className={field} placeholder="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={field} placeholder="Registered mobile (10-digit)" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className={primary} disabled={busy} onClick={submitReset}>
              {busy && <Loader2 size={15} className="animate-spin" />} Send OTP
            </button>
            <button onClick={() => switchMode("signin")} className="w-full text-center text-[12px] text-white/40 hover:text-white/70">
              Back to sign in
            </button>
          </>
        )}

        {mode === "reset" && sub === "otp" && (
          <>
            <p className="text-sm text-white/60">Enter the 6-digit code sent to {phone}.</p>
            <input className={field} placeholder="······" maxLength={6} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className={primary} disabled={busy} onClick={submitResetOtp}>
              {busy && <Loader2 size={15} className="animate-spin" />} Verify
            </button>
          </>
        )}

        {mode === "reset" && sub === "newpass" && (
          <>
            <p className="text-sm text-white/60">Set a new password for {email}.</p>
            <input className={field} placeholder="New password (min 8 chars)" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className={field} placeholder="Re-enter new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button className={primary} disabled={busy} onClick={submitNewPassword}>
              {busy && <Loader2 size={15} className="animate-spin" />} Update password & sign in
            </button>
          </>
        )}

        {err && <p className="text-red-300 text-sm">{err}</p>}
        <p className="text-[11px] text-white/30 text-center">Verify once — every tool & your dashboard stay unlocked.</p>
      </div>
    </div>
  );
}
