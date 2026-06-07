import { motion, useReducedMotion } from "motion/react";
import { Check, X, Minus, Crown } from "lucide-react";
import { COMPARISON, COMPARISON_COLS, BRAND, type CompCell } from "../../data/landing";

function Mark({ cell, featured }: { cell: CompCell; featured: boolean }) {
  const base =
    "flex h-7 w-7 items-center justify-center rounded-full ring-1";
  if (cell.v === "yes") {
    return (
      <span
        className={`${base} ${
          featured
            ? "bg-[#002bfa] text-white ring-[#60a5fa]/50 shadow-[0_0_18px_-4px_rgba(0,43,250,0.9)]"
            : "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
        }`}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
    );
  }
  if (cell.v === "partial") {
    return (
      <span className={`${base} bg-amber-500/15 text-amber-300 ring-amber-400/30`}>
        <Minus className="h-4 w-4" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className={`${base} bg-rose-500/10 text-rose-300/80 ring-rose-400/20`}>
      <X className="h-4 w-4" strokeWidth={3} />
    </span>
  );
}

export default function Comparison() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="compare"
      className="relative px-6 py-20"
      style={{ backgroundColor: BRAND.darkBg }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
            Engineered. Not guesswork.
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            WaterProofX vs the rest
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/55">
            A local applicator guesses. A marketplace forwards your lead. We seal
            the unseen with AI diagnosis, instrument-based engineering and a
            written warranty — line by line, here's the difference.
          </p>
        </div>

        {/* Matrix (horizontal scroll on small screens) */}
        <div className="mt-12 overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Header */}
            <div className="grid grid-cols-[1.7fr_1fr_1fr_1fr] gap-3">
              <div />
              {COMPARISON_COLS.map((c) => (
                <div
                  key={c.id}
                  className={`relative rounded-2xl p-4 text-center ${
                    c.featured
                      ? "bg-gradient-to-b from-[#002bfa]/25 to-[#002bfa]/5 ring-1 ring-[#002bfa]/40 shadow-[0_0_50px_-18px_rgba(0,43,250,0.9)]"
                      : "bg-white/[0.03] ring-1 ring-white/10"
                  }`}
                >
                  {c.featured && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#002bfa] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      <Crown className="h-3 w-3" /> Best
                    </span>
                  )}
                  <p
                    className={`text-sm font-black ${
                      c.featured ? "text-white" : "text-white/80"
                    }`}
                  >
                    {c.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/45">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="mt-3 space-y-2">
              {COMPARISON.map((row, i) => (
                <motion.div
                  key={row.feature}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="grid grid-cols-[1.7fr_1fr_1fr_1fr] items-stretch gap-3"
                >
                  <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
                    <p className="text-sm font-bold text-white">{row.feature}</p>
                    <p className="mt-0.5 text-xs leading-snug text-white/45">
                      {row.detail}
                    </p>
                  </div>

                  {(["wpx", "applicator", "marketplace"] as const).map((key) => {
                    const featured = key === "wpx";
                    const cell = row[key];
                    return (
                      <div
                        key={key}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-4 text-center ${
                          featured
                            ? "bg-[#002bfa]/[0.08] ring-1 ring-[#002bfa]/25"
                            : "bg-white/[0.02] ring-1 ring-white/5"
                        }`}
                      >
                        <Mark cell={cell} featured={featured} />
                        <span
                          className={`text-[11px] leading-tight ${
                            featured ? "text-white/70" : "text-white/40"
                          }`}
                        >
                          {cell.note}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl border border-[#002bfa]/30 bg-gradient-to-r from-[#002bfa]/15 to-transparent p-7 sm:flex-row">
          <p className="text-center text-base font-semibold text-white sm:text-left">
            Same price as a local guy? We match it — with AI, engineering &amp; a
            10-year warranty on top.
          </p>
          <a
            href="/app/diagnose"
            className="shrink-0 rounded-2xl bg-[#002bfa] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1d44ff]"
          >
            See the difference →
          </a>
        </div>
      </div>
    </section>
  );
}
