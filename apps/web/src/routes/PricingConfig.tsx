import { useEffect, useState } from "react";
import { get, put } from "../lib/api";

interface Cfg {
  version: string;
  currency: string;
  baseRatePerSqft: Record<string, number>;
  severityMult: Record<string, number>;
  tierMult: Record<string, number>;
  rangeBandPct: number;
  gstPct: number;
  wastagePct: number;
}

const SERVICES = ["terrace", "roof", "bathroom", "wall", "basement", "tank", "pool", "facade", "balcony"];
const SEVERITIES = ["minor", "moderate", "severe", "critical"];
const TIERS = ["basic", "medium", "premium"];

export function PricingConfigEditor() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    get<{ config: Cfg }>("/api/config/pricing")
      .then((r) => alive && setCfg(r.config))
      .catch((e) => alive && setError((e as Error).message));
    return () => { alive = false; };
  }, []);

  const finite = (next: string, fallback: number) => {
    const n = Number(next);
    return Number.isFinite(n) ? n : fallback;
  };
  function setBase(k: string, v: string) {
    setCfg((c) => c && ({ ...c, baseRatePerSqft: { ...c.baseRatePerSqft, [k]: finite(v, c.baseRatePerSqft[k] ?? 0) } }));
    setSaved(false);
  }
  function setSev(k: string, v: string) {
    setCfg((c) => c && ({ ...c, severityMult: { ...c.severityMult, [k]: finite(v, c.severityMult[k] ?? 0) } }));
    setSaved(false);
  }
  function setTier(k: string, v: string) {
    setCfg((c) => c && ({ ...c, tierMult: { ...c.tierMult, [k]: finite(v, c.tierMult[k] ?? 0) } }));
    setSaved(false);
  }
  function setNum(k: keyof Cfg, v: string) {
    setCfg((c) => c && ({ ...c, [k]: finite(v, (c[k] as number) ?? 0) }));
    setSaved(false);
  }

  async function save() {
    if (!cfg) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      const r = await put<{ ok: true; config: Cfg }>("/api/config/pricing", cfg);
      setCfg(r.config);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !cfg) return <p className="font-semibold text-rose-300">Error: {error}</p>;
  if (!cfg) return <p className="text-white/50">Loading config…</p>;

  const num = "w-24 rounded-lg border border-white/10 bg-[#0b1530] px-2 py-1.5 text-sm text-white focus:border-blue-400 focus:outline-none";
  const cell = "flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Base rate ₹/sqft (medium tier)</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <label key={s} className={cell}>
              <span className="capitalize text-white/70">{s}</span>
              <input type="number" className={num} value={cfg.baseRatePerSqft[s] ?? 0} onChange={(e) => setBase(s, e.target.value)} />
            </label>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Severity multiplier</h3>
          <div className="space-y-2">
            {SEVERITIES.map((s) => (
              <label key={s} className={cell}>
                <span className="capitalize text-white/70">{s}</span>
                <input type="number" step="0.05" className={num} value={cfg.severityMult[s] ?? 0} onChange={(e) => setSev(s, e.target.value)} />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Tier multiplier</h3>
          <div className="space-y-2">
            {TIERS.map((t) => (
              <label key={t} className={cell}>
                <span className="capitalize text-white/70">{t}</span>
                <input type="number" step="0.05" className={num} value={cfg.tierMult[t] ?? 0} onChange={(e) => setTier(t, e.target.value)} />
              </label>
            ))}
          </div>
        </section>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Global</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className={cell}><span className="text-white/70">GST %</span><input type="number" className={num} value={cfg.gstPct} onChange={(e) => setNum("gstPct", e.target.value)} /></label>
          <label className={cell}><span className="text-white/70">Wastage %</span><input type="number" className={num} value={cfg.wastagePct} onChange={(e) => setNum("wastagePct", e.target.value)} /></label>
          <label className={cell}><span className="text-white/70">Range band</span><input type="number" step="0.01" className={num} value={cfg.rangeBandPct} onChange={(e) => setNum("rangeBandPct", e.target.value)} /></label>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50">
          {saving ? "Saving…" : "Save pricing"}
        </button>
        {saved && <span className="text-sm font-semibold text-emerald-300">Saved ✓ — live on all calculators</span>}
        {error && <span className="text-sm font-semibold text-rose-300">{error}</span>}
        <span className="ml-auto text-xs text-white/30">version: {cfg.version}</span>
      </div>
    </div>
  );
}
