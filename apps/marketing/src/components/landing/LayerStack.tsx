import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { LAYERS, type Layer } from "../../data/landing";

// Visual height weighting per layer so the cross-section reads like a real
// engineered build-up (top armour thin, membrane fat, substrate broad).
const HEIGHT_WEIGHT: Record<string, number> = {
  "layer-1": 56,
  "layer-2": 68,
  "layer-3": 92,
  "layer-4": 60,
  "layer-5": 110,
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function CheckIcon({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full"
      style={{
        backgroundColor: hexToRgba(color, 0.16),
        boxShadow: `0 0 0 1px ${hexToRgba(color, 0.4)}`,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6.2L4.8 8.5L9.5 3.5"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function LayerStack() {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(LAYERS[0].id);
  const active: Layer = LAYERS.find((l) => l.id === activeId) ?? LAYERS[0];

  return (
    <section className="relative w-full bg-[#020617] py-20 md:py-28">
      {/* ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute -left-24 top-1/4 h-96 w-96 rounded-full blur-3xl"
          style={{ background: hexToRgba(active.color, 0.1) }}
        />
        <div className="absolute right-0 top-1/2 h-96 w-96 rounded-full bg-[#002bfa]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Heading */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-2xl md:mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#3b82f6]">
            Engineered Build-Up
          </span>
          <h2 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl">
            The Indestructible Core
            <span className="block text-white/50">5 engineered layers</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* LEFT — animated cross-section */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -24 }}
            whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:p-6"
          >
            <div className="flex flex-col gap-2.5" role="tablist" aria-label="Membrane layers">
              {LAYERS.map((layer, i) => {
                const isActive = layer.id === activeId;
                return (
                  <motion.button
                    key={layer.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${layer.name}, ${layer.thickness}`}
                    onClick={() => setActiveId(layer.id)}
                    onMouseEnter={() => setActiveId(layer.id)}
                    onFocus={() => setActiveId(layer.id)}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: reduce ? 0 : 0.1 + i * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    animate={
                      reduce
                        ? undefined
                        : { x: isActive ? 14 : 0, scale: isActive ? 1.015 : 1 }
                    }
                    className="group relative w-full overflow-hidden rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    style={{ height: HEIGHT_WEIGHT[layer.id] ?? 70 }}
                  >
                    {/* slab fill */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(105deg, ${hexToRgba(
                          layer.color,
                          isActive ? 0.42 : 0.2
                        )} 0%, ${hexToRgba(layer.color, isActive ? 0.18 : 0.08)} 100%)`,
                      }}
                    />
                    {/* left edge accent */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-1.5"
                      style={{ backgroundColor: layer.color }}
                    />
                    {/* border + glow */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-xl transition-shadow duration-300"
                      style={{
                        boxShadow: isActive
                          ? `inset 0 0 0 1px ${hexToRgba(
                              layer.color,
                              0.7
                            )}, 0 14px 40px -10px ${hexToRgba(layer.color, 0.55)}`
                          : `inset 0 0 0 1px ${hexToRgba(layer.color, 0.25)}`,
                      }}
                    />
                    {/* content */}
                    <span className="relative z-10 flex h-full items-center justify-between px-4 md:px-5">
                      <span className="flex items-center gap-3">
                        <span
                          className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-xs font-black"
                          style={{
                            backgroundColor: hexToRgba(layer.color, 0.22),
                            color: layer.color,
                            boxShadow: `inset 0 0 0 1px ${hexToRgba(layer.color, 0.5)}`,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className={`text-sm font-semibold transition-colors md:text-base ${
                            isActive ? "text-white" : "text-white/70"
                          }`}
                        >
                          {layer.name}
                        </span>
                      </span>
                      <span
                        className="flex-none rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide"
                        style={{
                          backgroundColor: hexToRgba(layer.color, 0.14),
                          color: hexToRgba(layer.color, 0.95),
                        }}
                      >
                        {layer.thickness}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-white/40">
              Cross-section · top to substrate
            </p>
          </motion.div>

          {/* RIGHT — details panel */}
          <div className="relative">
            <div className="lg:sticky lg:top-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1530] p-7 backdrop-blur md:p-9"
                  style={{
                    boxShadow: `0 30px 80px -30px ${hexToRgba(active.color, 0.5)}`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl"
                    style={{ background: hexToRgba(active.color, 0.22) }}
                  />

                  <div className="relative">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: hexToRgba(active.color, 0.16),
                        color: active.color,
                        boxShadow: `inset 0 0 0 1px ${hexToRgba(active.color, 0.4)}`,
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: active.color }}
                      />
                      {active.thickness}
                    </span>

                    <h3 className="mt-5 text-2xl font-black tracking-tight text-white md:text-3xl">
                      {active.name}
                    </h3>
                    <p
                      className="mt-1.5 text-sm italic md:text-base"
                      style={{ color: hexToRgba(active.color, 0.9) }}
                    >
                      {active.scientificName}
                    </p>

                    <p className="mt-5 text-sm leading-relaxed text-white/70 md:text-base">
                      {active.description}
                    </p>

                    <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {active.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                        >
                          <CheckIcon color={active.color} />
                          <span className="text-sm font-medium leading-snug text-white/85">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
