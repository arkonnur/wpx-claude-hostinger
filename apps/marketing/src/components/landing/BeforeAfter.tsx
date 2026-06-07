import { useCallback, useRef, useState } from "react";
import { MoveHorizontal, MapPin } from "lucide-react";
import { SHOWCASES, BRAND, type Showcase } from "../../data/landing";

function Slider({ item }: { item: Showcase }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<number>(50);
  const dragging = useRef<boolean>(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <div
        ref={containerRef}
        className="relative aspect-[16/10] w-full cursor-ew-resize select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* After (full background) */}
        <img
          src={item.afterImg}
          alt={`${item.title} after waterproofing`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute right-3 top-3 z-10 rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          After
        </span>

        {/* Before (clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${pos}%` }}
        >
          <img
            src={item.beforeImg}
            alt={`${item.title} before waterproofing`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full max-w-none object-cover"
            style={{ width: containerRef.current?.clientWidth ?? "100%" }}
          />
          <span className="absolute left-3 top-3 rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Before
          </span>
        </div>

        {/* Handle */}
        <div
          className="absolute inset-y-0 z-10 flex items-center"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
        >
          <div className="h-full w-0.5 bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
          <div className="absolute flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#020617] shadow-lg ring-4 ring-[#002bfa]/40">
            <MoveHorizontal className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
          <span className="rounded-full bg-[#002bfa]/15 px-2.5 py-0.5 font-semibold text-[#60a5fa] ring-1 ring-[#002bfa]/25">
            {item.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {item.location}
          </span>
          <span className="text-white/30">·</span>
          <span>{item.scope}</span>
        </div>
        <h3 className="mt-3 text-xl font-bold text-white">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          {item.highlightMsg}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {item.stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center"
            >
              <p className="text-lg font-black text-white">{s.value}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-white/45">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BeforeAfter() {
  return (
    <section
      id="work"
      className="relative px-6 py-20"
      style={{ backgroundColor: BRAND.darkBg }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
            Real results
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Before &amp; after — drag to reveal
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/55">
            Genuine WaterProofX projects across Bangalore and beyond. Slide the
            handle to see the transformation.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {SHOWCASES.map((item) => (
            <Slider key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
