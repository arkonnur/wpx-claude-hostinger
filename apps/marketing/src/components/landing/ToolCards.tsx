import { motion, useReducedMotion } from "motion/react";
import {
  ScanLine,
  Calculator,
  ReceiptIndianRupee,
  ClipboardCheck,
  ShieldCheck,
  Activity,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { TOOLS, BRAND } from "../../data/landing";

const ICONS: Record<string, LucideIcon> = {
  ScanLine,
  Calculator,
  ReceiptIndianRupee,
  ClipboardCheck,
  ShieldCheck,
  Activity,
};

const GATE_STYLE: Record<string, string> = {
  Free: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "OTP once": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Account: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
};

export default function ToolCards() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="tools"
      className="relative px-6 py-20"
      style={{ backgroundColor: BRAND.darkBg }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
            Free interactive tools
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Diagnose, estimate & book — in minutes
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/55">
            Start free with no sign-up. Verify once on WhatsApp to unlock exact
            pricing and your AI building-health report. No spam, ever.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, i) => {
            const Icon = ICONS[tool.icon] ?? Activity;
            return (
              <motion.a
                key={tool.id}
                href={tool.href}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] ${
                  tool.featured
                    ? "border-[#002bfa]/40 bg-gradient-to-b from-[#0b1530] to-[#020617] shadow-[0_0_60px_-20px_rgba(0,43,250,0.8)] ring-1 ring-[#002bfa]/20"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                {tool.badge && (
                  <span className="absolute right-4 top-4 rounded-full bg-[#002bfa] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    {tool.badge}
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#002bfa]/15 text-[#60a5fa] ring-1 ring-[#002bfa]/25 transition-colors group-hover:bg-[#002bfa] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-white">{tool.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">
                  {tool.desc}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${
                      GATE_STYLE[tool.gate] ?? GATE_STYLE.Free
                    }`}
                  >
                    {tool.gate}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#60a5fa]">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
