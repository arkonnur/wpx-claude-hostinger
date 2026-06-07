import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { PROCESS_STEPS } from "../../data/landing";

interface StepCardProps {
  step: (typeof PROCESS_STEPS)[number];
  index: number;
  total: number;
  reduced: boolean;
}

function StepCard({ step, index, total, reduced }: StepCardProps): React.JSX.Element {
  const delay = reduced ? 0 : index * 0.12;
  return (
    <motion.li
      className="relative flex flex-row items-start gap-5 md:flex-col md:items-center md:text-center"
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Numbered node */}
      <div className="relative z-10 flex shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[#002bfa]/30 blur-md" aria-hidden="true" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#3b82f6]/40 bg-[#0b1530] text-lg font-black text-white shadow-[0_0_24px_-6px_#002bfa] ring-1 ring-white/10">
          {step.id}
        </span>
      </div>

      {/* Copy */}
      <div className="flex-1 md:mt-5 md:max-w-[14rem]">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[#3b82f6]">
          Step {String(step.id).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <h3 className="text-lg font-bold tracking-tight text-white">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">{step.desc}</p>
      </div>
    </motion.li>
  );
}

export default function ProcessTimeline(): React.JSX.Element {
  const reduced = useReducedMotion() ?? false;
  const total = PROCESS_STEPS.length;

  const desktopLineRef = useRef<SVGSVGElement>(null);
  const desktopInView = useInView(desktopLineRef, { once: true, amount: 0.4 });
  const mobileLineRef = useRef<SVGSVGElement>(null);
  const mobileInView = useInView(mobileLineRef, { once: true, amount: 0.2 });

  const lineDraw = (inView: boolean) =>
    reduced
      ? { pathLength: 1 }
      : { pathLength: inView ? 1 : 0 };

  return (
    <section className="relative overflow-hidden bg-[#020617] py-20 md:py-28">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[#002bfa]/15 blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/60 backdrop-blur">
            The Process
          </span>
          <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
            How we make it permanent
          </h2>
          <p className="mt-4 text-base text-white/50">
            A six-stage engineered protocol — from molecular diagnosis to a warranty-backed,
            flood-tested seal.
          </p>
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="relative mt-20 hidden md:block">
          <svg
            ref={desktopLineRef}
            className="absolute left-0 top-6 h-2 w-full overflow-visible"
            viewBox="0 0 100 2"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="0" y1="1" x2="100" y2="1" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <motion.line
              x1="0"
              y1="1"
              x2="100"
              y2="1"
              stroke="url(#proc-grad-h)"
              strokeWidth="0.75"
              strokeLinecap="round"
              initial={reduced ? false : { pathLength: 0 }}
              animate={lineDraw(desktopInView)}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="proc-grad-h" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#002bfa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          <ol className="relative grid grid-cols-6 gap-4">
            {PROCESS_STEPS.map((step, i) => (
              <StepCard key={step.id} step={step} index={i} total={total} reduced={reduced} />
            ))}
          </ol>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="relative mt-14 md:hidden">
          <svg
            ref={mobileLineRef}
            className="absolute left-6 top-0 h-full w-2 overflow-visible"
            viewBox="0 0 2 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="1" y1="0" x2="1" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <motion.line
              x1="1"
              y1="0"
              x2="1"
              y2="100"
              stroke="url(#proc-grad-v)"
              strokeWidth="0.75"
              strokeLinecap="round"
              initial={reduced ? false : { pathLength: 0 }}
              animate={lineDraw(mobileInView)}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="proc-grad-v" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#002bfa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          <ol className="relative flex flex-col gap-10 pl-0">
            {PROCESS_STEPS.map((step, i) => (
              <StepCard key={step.id} step={step} index={i} total={total} reduced={reduced} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
