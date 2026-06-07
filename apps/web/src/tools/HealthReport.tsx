import { Link } from "@tanstack/react-router";
import { Activity, ScanLine, Calculator, ClipboardCheck, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolShell } from "./ToolShell";

interface Source {
  to: string;
  label: string;
  Icon: LucideIcon;
  done: boolean;
  weight: number;
}

// Wires to the MasterReport accumulator in the CRM build — completion drives the score.
const SOURCES: Source[] = [
  { to: "/diagnose", label: "AI photo diagnosis", Icon: ScanLine, done: false, weight: 35 },
  { to: "/estimate", label: "Exact estimate", Icon: Calculator, done: false, weight: 25 },
  { to: "/book", label: "On-site inspection", Icon: ClipboardCheck, done: false, weight: 40 },
];

export function HealthReport() {
  const completed = SOURCES.filter((s) => s.done).reduce((a, s) => a + s.weight, 0);

  return (
    <ToolShell
      title="Building Health Report"
      subtitle="Every tool you complete feeds one AI-powered building health score and master report."
      gate="Account"
      icon={<Activity className="h-6 w-6" />}
    >
      <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
        {/* Score ring */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="relative grid h-40 w-40 place-items-center">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#002bfa"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(completed / 100) * 327} 327`}
              />
            </svg>
            <div className="absolute">
              <p className="text-3xl font-black">{completed}%</p>
              <p className="text-[11px] uppercase tracking-wider text-white/45">complete</p>
            </div>
          </div>
          <p className="mt-5 text-sm text-white/55">
            Finish the steps to unlock your full building health score and PDF master report.
          </p>
        </div>

        {/* Source checklist */}
        <div className="space-y-3">
          {SOURCES.map(({ to, label, Icon, done, weight }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/25"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#002bfa]/15 text-[#60a5fa] ring-1 ring-[#002bfa]/30">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold">{label}</p>
                <p className="text-xs text-white/45">Contributes {weight}% to your score</p>
              </div>
              <span className={`text-xs font-bold ${done ? "text-emerald-300" : "text-white/40"}`}>
                {done ? "Done" : "Start →"}
              </span>
            </Link>
          ))}

          <div className="flex items-center gap-3 rounded-2xl border border-[#002bfa]/25 bg-[#002bfa]/[0.06] p-4">
            <Lock className="h-5 w-5 text-[#60a5fa]" />
            <p className="text-sm text-white/60">
              The deep root-cause report stays awareness-level online — full diagnosis
              is delivered on-site. We never show a confidence score.
            </p>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
