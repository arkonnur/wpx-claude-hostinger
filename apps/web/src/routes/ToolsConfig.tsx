import { useEffect, useState } from "react";
import { get, put } from "../lib/api";

interface ToolConfig { toolKey: string; enabled: boolean; sortOrder: number; gate: string; access: string }

const LABEL: Record<string, string> = {
  diagnose: "AI Photo Diagnosis", calculator: "Instant Cost Calculator", estimate: "Exact Tiered Estimate",
  book: "Free Site Inspection", warranty: "Warranty Check", report: "Building Health Report",
};
const GATES = [
  { v: "public", l: "Free (no gate)" },
  { v: "otp", l: "OTP once" },
  { v: "account", l: "Account" },
];
const ACCESS = [
  { v: "self_serve", l: "Self-serve" },
  { v: "site_visit_only", l: "Site visit only" },
];

export function ToolsConfigEditor() {
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    get<{ tools: ToolConfig[] }>("/api/config/tools")
      .then((r) => alive && setTools([...r.tools].sort((a, b) => a.sortOrder - b.sortOrder)))
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  function set(key: string, p: Partial<ToolConfig>) {
    setTools((ts) => ts.map((t) => (t.toolKey === key ? { ...t, ...p } : t)));
    setSaved(false);
  }
  function move(i: number, dir: -1 | 1) {
    setTools((ts) => {
      const j = i + dir;
      if (j < 0 || j >= ts.length) return ts;
      const next = [...ts];
      const tmp = next[i]!;
      next[i] = next[j]!;
      next[j] = tmp;
      return next.map((t, idx) => ({ ...t, sortOrder: idx }));
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const payload = tools.map((t, idx) => ({ ...t, sortOrder: idx }));
      const r = await put<{ tools: ToolConfig[] }>("/api/config/tools", payload);
      setTools([...r.tools].sort((a, b) => a.sortOrder - b.sortOrder));
      setSaved(true);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="text-white/50">Loading tools…</p>;
  if (error && !tools.length) return <p className="font-semibold text-rose-300">Error: {error}</p>;

  const sel = "rounded-lg border border-white/10 bg-[#0b1530] px-2 py-1.5 text-sm text-white focus:border-blue-400 focus:outline-none";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {tools.map((t, i) => (
          <div key={t.toolKey} className={`flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 ${t.enabled ? "" : "opacity-50"}`}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-white/40 hover:text-white disabled:opacity-20">▲</button>
              <button onClick={() => move(i, 1)} disabled={i === tools.length - 1} className="text-white/40 hover:text-white disabled:opacity-20">▼</button>
            </div>
            <div className="min-w-[160px] flex-1">
              <p className="font-bold">{LABEL[t.toolKey] ?? t.toolKey}</p>
              <p className="text-xs text-white/35">{t.toolKey}</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-white/55">
              <input type="checkbox" checked={t.enabled} onChange={(e) => set(t.toolKey, { enabled: e.target.checked })} /> Enabled
            </label>
            <select className={sel} value={t.gate} onChange={(e) => set(t.toolKey, { gate: e.target.value })}>
              {GATES.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
            <select className={sel} value={t.access} onChange={(e) => set(t.toolKey, { access: e.target.value })}>
              {ACCESS.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50">
          {saving ? "Saving…" : "Save tool settings"}
        </button>
        {saved && <span className="text-sm font-semibold text-emerald-300">Saved ✓ — live on the tool hub</span>}
        {error && <span className="text-sm font-semibold text-rose-300">{error}</span>}
      </div>
    </div>
  );
}
