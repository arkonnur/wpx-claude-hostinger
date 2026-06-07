import { useState } from "react";
import { quickRange, fmtINR, type ServiceType, type Severity } from "@wpx/core";

// Runs the SAME @wpx/core pricing engine client-side — instant, no backend call
// needed for the marketing teaser. Exact price + PDF live behind OTP in /app.
const SERVICES: { id: ServiceType; label: string }[] = [
  { id: "terrace", label: "Terrace" },
  { id: "bathroom", label: "Bathroom" },
  { id: "wall", label: "Wall" },
  { id: "tank", label: "Tank" },
];

export default function CalculatorIsland() {
  const [service, setService] = useState<ServiceType>("terrace");
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [area, setArea] = useState("1000");
  const r = area && +area > 0 ? quickRange({ service, area: +area, severity }) : null;

  const chip = (a: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition ${
      a ? "bg-blue-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
    }`;

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-5 space-y-4 max-w-md">
      <div className="flex flex-wrap gap-2">
        {SERVICES.map((s) => (
          <button key={s.id} onClick={() => setService(s.id)} className={chip(service === s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["minor", "moderate", "severe", "critical"] as Severity[]).map((s) => (
          <button key={s} onClick={() => setSeverity(s)} className={chip(severity === s)}>
            {s}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        placeholder="Area (sqft)"
        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400"
      />
      {r && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-400/30 p-4">
          <p className="text-xs text-white/50">Estimated range · {r.areaSqft} sqft</p>
          <p className="text-2xl font-black">
            {fmtINR(r.min)} <span className="text-white/40">–</span> {fmtINR(r.max)}
          </p>
          <a
            href="/app"
            className="mt-3 block text-center py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm"
          >
            Get exact price → verify mobile
          </a>
        </div>
      )}
    </div>
  );
}
