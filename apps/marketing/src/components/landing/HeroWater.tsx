import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { SLIDES, BRAND } from "../../data/landing";

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
}

function RainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const drops: Drop[] = [];
    const ripples: Ripple[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(160, Math.floor((width * height) / 9000));
      drops.length = 0;
      for (let i = 0; i < target; i++) {
        drops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          len: 12 + Math.random() * 26,
          speed: 6 + Math.random() * 11,
          alpha: 0.08 + Math.random() * 0.28,
        });
      }
    };

    const spawnRipple = () => {
      ripples.push({
        x: Math.random() * width,
        y: height * (0.62 + Math.random() * 0.36),
        r: 0,
        maxR: 14 + Math.random() * 34,
        alpha: 0.5,
      });
    };

    let lastRipple = 0;

    const tick = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      // rain streaks
      ctx.lineCap = "round";
      for (const d of drops) {
        ctx.strokeStyle = `rgba(147, 197, 253, ${d.alpha})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1.5, d.y + d.len);
        ctx.stroke();

        d.y += d.speed;
        d.x -= 0.4;
        if (d.y > height) {
          d.y = -d.len;
          d.x = Math.random() * width;
        }
      }

      // ripples
      if (t - lastRipple > 280) {
        lastRipple = t;
        if (ripples.length < 22) spawnRipple();
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 0.9;
        rp.alpha = 0.5 * (1 - rp.r / rp.maxR);
        if (rp.r >= rp.maxR || rp.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(96, 165, 250, ${rp.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}

export default function HeroWater() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = window.setInterval(advance, 5000);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused, advance]);

  const slide = SLIDES[index];

  return (
    <section
      className="relative isolate flex min-h-screen w-full flex-col overflow-hidden"
      style={{ backgroundColor: BRAND.darkBg }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {reduceMotion ? (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 70% 10%, rgba(0,43,250,0.28), transparent 55%), radial-gradient(90% 70% at 20% 90%, rgba(59,130,246,0.18), transparent 60%)",
            }}
          />
        ) : (
          <RainCanvas />
        )}
        {/* cinematic overlays */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(110% 80% at 75% 8%, rgba(0,43,250,0.30), transparent 55%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/60 via-[#020617]/40 to-[#020617]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-transparent" />
      </div>

      {/* Trust row */}
      <div className="relative z-10 px-6 pt-8 md:pt-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium uppercase tracking-wider text-white/50">
          <span>Certified applicators</span>
          <span className="text-white/20">·</span>
          <span>5&ndash;15 yr warranty</span>
          <span className="text-white/20">·</span>
          <span>Free site visit</span>
          <span className="text-white/20">·</span>
          <span className="text-white/70">{BRAND.city}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-center px-6 py-12 md:py-16">
        <div className="mx-auto w-full max-w-6xl">
          {/* Positioning badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#002bfa]/30 bg-[#002bfa]/10 px-4 py-1.5 text-xs font-semibold text-[#60a5fa] backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#60a5fa] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#60a5fa]" />
            </span>
            <span className="text-white/70">India's 1st</span>
            <span className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#002bfa] px-2 py-0.5 font-black text-white shadow-[0_0_18px_-2px_rgba(0,43,250,0.9)]">
              AI Powered
            </span>
            <span className="text-white/70">and Engineered Waterproofing Services</span>
          </div>

          {/* SEO anchor headline (single H1) */}
          <h1 className="mt-5 max-w-3xl text-balance text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#002bfa] bg-clip-text text-transparent">
              Seal the unseen.
            </span>{" "}
            Engineering-backed waterproofing in Bangalore.
          </h1>
          <p className="mt-4 text-base font-bold uppercase tracking-[0.18em] text-white/45">
            Engineered. Not guesswork.
          </p>

          {/* Rotating slide */}
          <div className="mt-10 min-h-[19rem] md:min-h-[17rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
                    {slide.phase}
                  </p>
                  <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                    {slide.title}{" "}
                    <span className="bg-gradient-to-r from-[#60a5fa] to-[#002bfa] bg-clip-text text-transparent">
                      {slide.highlight}
                    </span>
                  </h2>
                  <p className="mt-4 text-lg font-semibold text-white/80">
                    {slide.subtitle}
                  </p>
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-white/60">
                    {slide.description}
                  </p>
                </div>

                <div className="md:justify-self-end">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-md shadow-[0_0_60px_-15px_rgba(0,43,250,0.6)] ring-1 ring-[#002bfa]/20">
                    <p className="bg-gradient-to-br from-white to-[#60a5fa] bg-clip-text text-6xl font-black tracking-tight text-transparent md:text-7xl">
                      {slide.metric}
                    </p>
                    <p className="mt-3 text-sm leading-snug text-white/50">
                      {slide.metricLabel}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="/app"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#002bfa] px-8 py-4 text-base font-bold text-white shadow-[0_10px_40px_-10px_rgba(0,43,250,0.8)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#1d44ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
            >
              Get free estimate
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-colors duration-200 hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
            >
              Book free site visit
            </a>
          </div>

          {/* Dots */}
          <div className="mt-10 flex items-center gap-3">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}: ${s.phase}`}
                aria-current={i === index}
                className="group relative h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
                style={{ width: i === index ? "2.25rem" : "0.625rem" }}
              >
                <span
                  className={`block h-full w-full rounded-full transition-colors duration-300 ${
                    i === index ? "bg-[#3b82f6]" : "bg-white/20 group-hover:bg-white/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
