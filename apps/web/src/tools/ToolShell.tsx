import { useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { useSession } from "../lib/session";
import { useAuthUI } from "../lib/authui";
import { track } from "../lib/track";

export type Gate = "Free" | "OTP once" | "Account";

const GATE_STYLE: Record<Gate, string> = {
  Free: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "OTP once": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Account: "bg-[#002bfa]/15 text-[#60a5fa] ring-[#002bfa]/40",
};

export function GateBadge({ gate }: { gate: Gate }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${GATE_STYLE[gate]}`}>
      {gate === "Free" ? <ShieldCheck className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {gate}
    </span>
  );
}

/** Wraps tool body; shows a gate wall when the user hasn't met the access tier. */
export function ToolShell({
  title,
  subtitle,
  gate,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  gate: Gate;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const { verified, role, loading } = useSession();
  const { open } = useAuthUI();

  useEffect(() => {
    track("tool_view", { tool: title, gate });
  }, [title, gate]);

  const needsVerify = gate === "OTP once" && !verified;
  const needsAccount = gate === "Account" && !role;
  const blocked = !loading && (needsVerify || needsAccount);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> All tools
      </Link>

      <div className="mt-5 flex items-start gap-4">
        {icon && (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002bfa]/15 text-[#60a5fa] ring-1 ring-[#002bfa]/30">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
            <GateBadge gate={gate} />
          </div>
          <p className="mt-1 text-white/55">{subtitle}</p>
        </div>
      </div>

      <div className="mt-8">
        {blocked ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#002bfa]/15 text-[#60a5fa] ring-1 ring-[#002bfa]/30">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-bold">
              {needsVerify ? "Verify your mobile once" : "Sign in to continue"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
              {needsVerify
                ? "One WhatsApp OTP unlocks this tool forever on this device. No password, no spam."
                : "This building-level report needs an account so we can save your history securely."}
            </p>
            <button
              onClick={open}
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#002bfa] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1d44ff]"
            >
              {needsVerify ? "Verify mobile" : "Sign in"}
            </button>
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}
