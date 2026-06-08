import { useState } from "react";
import { Calculator, Lock, ArrowRight, Check } from "lucide-react";
import { fmtINR, type ServiceType, type Severity, type QuickRangeResult, type ExactEstimateResult } from "@wpx/core";
import { post } from "../lib/api";
import { track } from "../lib/track";
import { useSession } from "../lib/session";
import { useAuthUI } from "../lib/authui";

const SERVICES: { id: ServiceType; label: string }[] = [
  { id: "terrace", label: "Terrace / Roof" },
  { id: "bathroom", label: "Bathroom" },
  { id: "wall", label: "Wall dampness" },
  { id: "basement", label: "Basement" },
  { id: "tank", label: "Water tank" },
  { id: "facade", label: "Exterior facade" },
];

const SEVERITIES: { id: Severity; label: string }[] = [
  { id: "minor", label: "Minor" },
  { id: "moderate", label: "Moderate" },
  { id: "severe", label: "Severe" },
  { id: "critical", label: "Critical" },
];

const chip = (active: boolean) =>
  `px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
    active ? "bg-blue-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
  }`;

export function QuickCalculator() {
  const [service, setService] = useState<ServiceType>("terrace");
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [area, setArea] = useState("");
  const [result, setResult] = useState<QuickRangeResult | null>(null);
  const [exact, setExact] = useState<ExactEstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { verified } = useSession();
  const { open } = useAuthUI();

  async function getExact() {
    if (!verified) {
      open();
      return;
    }
    const a = parseFloat(area);
    setError("");
    setLoading(true);
    try {
      const r = await post<ExactEstimateResult>("/api/pricing/exact", { service, area: a, severity });
      setExact(r);
      track("estimate_view", { service, severity, area: a });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function calc() {
    const a = parseFloat(area);
    if (!a || a <= 0) {
      setError("Enter a valid area");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const r = await post<QuickRangeResult>("/api/pricing/quick", { service, area: a, severity });
      setResult(r);
      track("calculator_run", { service, severity, area: a, min: r.min, max: r.max });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Calculator size={18} className="text-blue-400" />
        <h2 className="text-lg font-bold">Quick cost calculator</h2>
        <span className="ml-auto text-xs text-white/40">Free · no signup</span>
      </div>

      <div>
        <p className="text-xs font-semibold text-blue-200 mb-2">Service</p>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <button key={s.id} onClick={() => setService(s.id)} className={chip(service === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-blue-200 mb-2">Severity</p>
        <div className="flex flex-wrap gap-2">
          {SEVERITIES.map((s) => (
            <button key={s.id} onClick={() => setSeverity(s.id)} className={chip(severity === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-blue-200 mb-2">Area (sqft)</p>
        <input
          type="number"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. 1200"
          className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400"
        />
      </div>

      {error && <p className="text-red-300 text-sm">{error}</p>}

      <button
        onClick={calc}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold text-sm disabled:opacity-50"
      >
        {loading ? "Calculating…" : "Get cost range"}
      </button>

      {result && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-400/30 p-4 space-y-3">
          <p className="text-xs text-white/50">Estimated cost for {result.areaSqft} sqft</p>
          <p className="text-2xl font-black">
            {fmtINR(result.min)} <span className="text-white/40">–</span> {fmtINR(result.max)}
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 p-3">
            <Lock size={15} className="text-amber-300 shrink-0" />
            <p className="text-xs text-white/70">
              Want the <b>exact price</b> with basic / medium / premium options + PDF? Verify your
              mobile once — then every tool stays unlocked.
            </p>
          </div>
          <button
            onClick={getExact}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {verified ? "Show exact tiered price" : "Get exact price"} <ArrowRight size={15} />
          </button>
        </div>
      )}

      {exact && (
        <div className="grid sm:grid-cols-3 gap-3">
          {exact.tiers.map((t) => (
            <div key={t.tier} className="rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-blue-300 font-bold">{t.tier}</p>
              <p className="text-xl font-black mt-1">{fmtINR(t.total)}</p>
              <p className="text-[11px] text-white/40">incl. GST · {fmtINR(t.ratePerSqft)}/sqft</p>
              <div className="mt-2 space-y-1 text-[11px] text-white/60">
                <p className="flex items-center gap-1"><Check size={11} className="text-green-400" /> Material + labour</p>
                <p className="flex items-center gap-1"><Check size={11} className="text-green-400" /> Wastage incl.</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
