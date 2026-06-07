import { motion, useReducedMotion } from "motion/react";
import {
  Star,
  ShieldCheck,
  BadgeCheck,
  IndianRupee,
  Microscope,
  Quote,
} from "lucide-react";
import { TESTIMONIALS, type Testimonial } from "../../data/landing";

interface Guarantee {
  id: string;
  label: string;
  Icon: typeof ShieldCheck;
}

const GUARANTEES: Guarantee[] = [
  { id: "g1", label: "Certified applicators", Icon: ShieldCheck },
  { id: "g2", label: "5–15 year warranty", Icon: BadgeCheck },
  {
    id: "g3",
    label: "Lowest-price guarantee (matches genuine written quotes)",
    Icon: IndianRupee,
  },
  { id: "g4", label: "Free on-site engineering inspection", Icon: Microscope },
];

function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`${clamped} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={
            i < clamped
              ? "h-4 w-4 fill-[#3b82f6] text-[#3b82f6]"
              : "h-4 w-4 text-white/15"
          }
        />
      ))}
    </div>
  );
}

function TestimonialCard({
  item,
  index,
  reduced,
}: {
  item: Testimonial;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.figure
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
      className="group relative flex min-w-[85%] snap-center flex-col rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur md:min-w-0 md:p-9"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-[#002bfa]/40 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: "0 0 60px -20px #002bfa" }}
      />
      <Quote
        aria-hidden="true"
        className="mb-5 h-9 w-9 text-[#3b82f6]/40"
      />
      <Stars rating={item.rating} />
      <blockquote className="mt-5 text-lg font-medium leading-relaxed text-white/90 md:text-xl">
        “{item.quote}”
      </blockquote>
      <figcaption className="mt-7 flex items-center gap-4 border-t border-white/10 pt-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#002bfa] to-[#3b82f6] text-sm font-black text-white">
          {item.author
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-bold text-white">{item.author}</span>
          <span className="text-sm text-white/50">
            {item.role} · {item.company}
          </span>
        </span>
      </figcaption>
    </motion.figure>
  );
}

export default function Testimonials() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-[#020617] py-20 md:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[#002bfa]/10 blur-[140px]"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 backdrop-blur">
            Proof, not promises
          </span>
          <h2 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
            Trusted by architects &amp; asset owners
          </h2>
          <p className="mt-4 text-base text-white/50 md:text-lg">
            Engineered systems backed by measurable results and the people who
            stake their buildings on them.
          </p>
        </motion.div>

        {/* Testimonials: horizontal scroll-snap on mobile, 2-col grid on desktop */}
        <div className="mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
          {TESTIMONIALS.map((item, i) => (
            <TestimonialCard
              key={item.id}
              item={item}
              index={i}
              reduced={reduced}
            />
          ))}
        </div>

        {/* Trust band */}
        <motion.ul
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 grid grid-cols-2 gap-4 md:mt-20 md:grid-cols-4"
        >
          {GUARANTEES.map(({ id, label, Icon }) => (
            <li
              key={id}
              className="group flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors duration-300 hover:border-[#002bfa]/40 hover:bg-white/[0.07]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#002bfa]/15 ring-1 ring-inset ring-[#3b82f6]/30">
                <Icon aria-hidden="true" className="h-6 w-6 text-[#3b82f6]" />
              </span>
              <span className="text-sm font-semibold leading-snug text-white/85">
                {label}
              </span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
