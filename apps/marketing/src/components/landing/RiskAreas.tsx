import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence, type Variants } from "motion/react";
import { RISK_AREAS, type RiskArea } from "../../data/landing";

// Map a 0–10 severity to a hue from accent-blue (low) toward red (high).
function severityColor(risk: number): string {
  const t = Math.min(Math.max(risk / 10, 0), 1);
  // Interpolate hue: 217 (blue) -> 0 (red)
  const hue = 217 * (1 - t);
  const sat = 85;
  const light = 58;
  return `hsl(${hue.toFixed(0)} ${sat}% ${light}%)`;
}

function severityLabel(risk: number): string {
  if (risk >= 9) return "Critical";
  if (risk >= 7) return "High";
  if (risk >= 5) return "Elevated";
  return "Moderate";
}

interface CardProps {
  area: RiskArea;
  index: number;
  reduced: boolean;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function RiskCard({ area, index, reduced }: CardProps) {
  const [open, setOpen] = useState<boolean>(false);
  const color = severityColor(area.riskFactor);
  const pct = Math.min(Math.max(area.riskFactor / 10, 0), 1) * 100;

  return (
    <motion.article
      custom={index}
      variants={reduced ? undefined : cardVariants}
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors duration-300 hover:border-white/20 focus-within:border-white/20"
    >
      {/* soft severity glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: `0 0 0 1px ${color}33, 0 24px 60px -28px ${color}66` }}
      />

      <div className="relative flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold tracking-tight text-white">{area.name}</h3>
          <span
            className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}
          >
            {severityLabel(area.riskFactor)}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-white/70">{area.description}</p>

        {/* Risk meter */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="uppercase tracking-wider text-white/40">Risk factor</span>
            <span className="tabular-nums font-semibold" style={{ color }}>
              {area.riskFactor}/10
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #3b82f6, ${color})` }}
              initial={reduced ? false : { width: 0 }}
              whileInView={reduced ? undefined : { width: `${pct}%` }}
              animate={reduced ? { width: `${pct}%` } : undefined}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.9, delay: 0.15 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Vulnerability message — expands on hover/focus */}
        {reduced ? (
          <p className="mt-4 text-xs leading-relaxed text-white/50">{area.vulnerabilityMsg}</p>
        ) : (
          <AnimatePresence initial={false}>
            {open && (
              <motion.p
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden text-xs leading-relaxed text-white/55"
              >
                <span className="font-semibold text-white/70">Why it fails: </span>
                {area.vulnerabilityMsg}
              </motion.p>
            )}
          </AnimatePresence>
        )}

        {/* Solutions */}
        <ul className="mt-5 space-y-2">
          {area.solutions.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-white/70">
              <span
                aria-hidden
                className="mt-1.5 size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{s}</span>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-white/50">
            from <span className="font-bold text-white">₹{area.baseSftPrice}</span>
            <span className="text-white/40">/sqft</span>
          </span>
          <a
            href="/app"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#3b82f6] transition-colors hover:text-white"
          >
            Check my risk
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export default function RiskAreas() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="relative bg-[#020617] py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <motion.header
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-2xl md:mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#3b82f6]">
            Risk Areas
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
            Where buildings fail
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Every surface has a different failure mode. We engineer for each.
          </p>
        </motion.header>

        <motion.div
          initial={reduced ? false : "hidden"}
          whileInView={reduced ? undefined : "show"}
          viewport={{ once: true, amount: 0.15 }}
          variants={
            reduced
              ? undefined
              : { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
          }
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {RISK_AREAS.map((area, i) => (
            <RiskCard key={area.id} area={area} index={i} reduced={reduced} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
