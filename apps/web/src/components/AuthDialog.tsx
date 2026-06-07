// Smart auth flow. One OTP ever per number; returning numbers route to login.
// Steps: phone → (otp | login | set_password) → verify/register → done.
import { useRef, useState } from "react";
import { X, Loader2, ShieldCheck } from "lucide-react";
import { ApiError } from "../lib/api";
import { checkPhone, sendOtp, verifyOtp, register, login, type CheckRoute } from "../lib/auth";
import { useSession } from "../lib/session";

type Step = "phone" | "otp" | "register" | "login" | "done";

export function AuthDialog({ onClose }: { onClose: () => void }) {
  const { refresh } = useSession();
  const [step, setStep] = useState<Step>("phone");
  const [route, setRoute] = useState<CheckRoute>("otp");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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

  const startPhone = () =>
    run(async () => {
      const { route } = await checkPhone(phone);
      setRoute(route);
      if (route === "login") {
        setStep("login");
      } else {
        await sendOtp(phone, { honeypot: honeypot.current, formFillMs: Date.now() - renderedAt.current });
        setStep("otp");
      }
    });

  const submitOtp = () =>
    run(async () => {
      const { hasAccount } = await verifyOtp(phone, code);
      if (hasAccount) {
        // verified but account exists → just log in with password
        setStep("login");
      } else {
        setStep("register");
      }
    });

  const submitRegister = () =>
    run(async () => {
      await register({ phone, email, password, name });
      await refresh();
      setStep("done");
      onClose();
    });

  const submitLogin = () =>
    run(async () => {
      const res = await login(email, password);
      if (res.needs_otp) {
        // step-up: send OTP for this phone, then user re-submits login after verify
        await sendOtp(res.phone ?? phone, { formFillMs: 9999 });
        setPhone(res.phone ?? phone);
        setRoute("login");
        setStep("otp");
        return;
      }
      await refresh();
      setStep("done");
      onClose();
    });

  // after a step-up OTP verify during login, continue to password
  const submitStepUpOtp = () =>
    run(async () => {
      await verifyOtp(phone, code);
      setStep("login");
    });

  const field = "w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400";
  const primary = "w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2";

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

        {step === "phone" && (
          <>
            <p className="text-sm text-white/60">Enter your WhatsApp mobile number to continue.</p>
            <input className={field} placeholder="WhatsApp mobile (10-digit)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button className={primary} disabled={busy} onClick={startPhone}>
              {busy && <Loader2 size={15} className="animate-spin" />} Continue
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="text-sm text-white/60">Enter the 6-digit code sent on WhatsApp to {phone}.</p>
            <input className={field} placeholder="······" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" />
            <button className={primary} disabled={busy} onClick={route === "login" ? submitStepUpOtp : submitOtp}>
              {busy && <Loader2 size={15} className="animate-spin" />} Verify
            </button>
          </>
        )}

        {step === "register" && (
          <>
            <p className="text-sm text-white/60">Create your account — used to log in next time (no OTP).</p>
            <input className={field} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={field} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={field} placeholder="Password (min 8 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className={primary} disabled={busy} onClick={submitRegister}>
              {busy && <Loader2 size={15} className="animate-spin" />} Create account
            </button>
          </>
        )}

        {step === "login" && (
          <>
            <p className="text-sm text-white/60">Welcome back — log in with your email & password.</p>
            <input className={field} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={field} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className={primary} disabled={busy} onClick={submitLogin}>
              {busy && <Loader2 size={15} className="animate-spin" />} Log in
            </button>
          </>
        )}

        {err && <p className="text-red-300 text-sm">{err}</p>}
        <p className="text-[11px] text-white/30 text-center">Verify once — every tool & your dashboard stay unlocked.</p>
      </div>
    </div>
  );
}
