import { Link } from "@tanstack/react-router";
import {
  ScanLine,
  Calculator,
  ReceiptIndianRupee,
  ClipboardCheck,
  ShieldCheck,
  Activity,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GateBadge, type Gate } from "./ToolShell";

interface Tool {
  to: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
  gate: Gate;
  badge?: string;
  featured?: boolean;
}

const TOOLS: Tool[] = [
  {
    to: "/diagnose",
    title: "AI Photo Diagnosis",
    desc: "Upload a photo of dampness, a terrace or a leak — get an instant AI condition report.",
    Icon: ScanLine,
    gate: "OTP once",
    badge: "Most popular",
    featured: true,
  },
  {
    to: "/calculator",
    title: "Instant Cost Calculator",
    desc: "Enter area + surface, get a transparent Bangalore price band in seconds. No sign-up.",
    Icon: Calculator,
    gate: "Free",
  },
  {
    to: "/estimate",
    title: "Exact Tiered Estimate",
    desc: "Basic / medium / premium pricing with GST, brands and coverage breakdown.",
    Icon: ReceiptIndianRupee,
    gate: "OTP once",
  },
  {
    to: "/book",
    title: "Free Site Inspection",
    desc: "Book a free on-site engineering inspection — moisture mapping, slope & crack survey.",
    Icon: ClipboardCheck,
    gate: "Free",
  },
  {
    to: "/warranty",
    title: "Warranty Check",
    desc: "Verify your WaterProofX warranty card and service history by number.",
    Icon: ShieldCheck,
    gate: "Free",
  },
  {
    to: "/report",
    title: "Building Health Report",
    desc: "Combine every tool into one AI-powered building health score and master report.",
    Icon: Activity,
    gate: "Account",
  },
];

export function ToolHub() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
        Engineered. Not guesswork.
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        Waterproofing tools
      </h1>
      <p className="mt-2 max-w-2xl text-white/55">
        Start free, get an instant answer. Verify your mobile once to unlock exact
        pricing and AI diagnosis — we seal the unseen with engineering, not guesswork.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ to, title, desc, Icon, gate, badge, featured }) => (
          <Link
            key={to}
            to={to}
            className={`group relative flex flex-col rounded-3xl p-6 ring-1 transition-all hover:-translate-y-1 ${
              featured
                ? "bg-gradient-to-b from-[#002bfa]/20 to-[#002bfa]/[0.03] ring-[#002bfa]/40 shadow-[0_0_50px_-18px_rgba(0,43,250,0.9)]"
                : "bg-white/[0.03] ring-white/10 hover:ring-white/25"
            }`}
          >
            {badge && (
              <span className="absolute right-4 top-4 rounded-full bg-[#002bfa] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {badge}
              </span>
            )}
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#002bfa]/15 text-[#60a5fa] ring-1 ring-[#002bfa]/30">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-bold">{title}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/55">{desc}</p>
            <div className="mt-5 flex items-center justify-between">
              <GateBadge gate={gate} />
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#60a5fa]">
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
