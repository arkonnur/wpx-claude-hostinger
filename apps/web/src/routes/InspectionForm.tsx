import { useEffect, useState } from "react";
import { get, post, patch } from "../lib/api";
import { useSession } from "../lib/session";

interface Finding { zone?: string; issue?: string; severity?: string; note?: string }
interface Insp {
  id: string;
  status: string;
  readings: { findings?: Finding[]; summary?: string; recommendation?: string } | null;
}
interface Loaded {
  inspection: Insp;
  lead: { service: string | null; severity: string | null; areaSqft: number | null };
  contact: { name: string | null; phone: string | null; address: string | null };
}

const SEVERITIES = ["minor", "moderate", "severe", "critical"];

/** On-site inspection capture, opened from a crew visit. Get-or-creates by appointment. */
export function InspectionForm({ apptId, onClose }: { apptId: string; onClose: () => void }) {
  const { role } = useSession();
  const isStaff = role === "admin" || role === "owner";
  const [jobMsg, setJobMsg] = useState("");
  const [data, setData] = useState<Loaded | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    let alive = true;
    post<{ inspection: Insp }>(`/api/inspections/for-appointment/${apptId}`, {})
      .then(async (r) => {
        // fetch full context (lead + contact) for the report header
        const loaded = await get<Loaded>(`/api/inspections/${r.inspection.id}`);
        if (!alive) return;
        setData(loaded);
        const rd = loaded.inspection.readings ?? {};
        setFindings(rd.findings?.length ? rd.findings : [{ zone: "", issue: "", severity: "moderate", note: "" }]);
        setSummary(rd.summary ?? "");
        setRecommendation(rd.recommendation ?? "");
      })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [apptId]);

  function setF(i: number, k: keyof Finding, v: string) {
    setFindings((arr) => arr.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));
    setSavedMsg("");
  }
  const addRow = () => setFindings((a) => [...a, { zone: "", issue: "", severity: "moderate", note: "" }]);
  const delRow = (i: number) => setFindings((a) => a.filter((_, idx) => idx !== i));

  async function save(markReady: boolean) {
    if (!data) return;
    setSaving(true); setError(""); setSavedMsg("");
    const cleaned = findings.filter((f) => f.zone || f.issue || f.note);
    try {
      await patch(`/api/inspections/${data.inspection.id}`, {
        findings: cleaned,
        summary,
        recommendation,
        status: markReady ? "report_ready" : "in_progress",
      });
      setSavedMsg(markReady ? "Report submitted ✓" : "Saved ✓");
      if (markReady) setTimeout(onClose, 800);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function generateQuote() {
    if (!data) return;
    setSaving(true); setError(""); setJobMsg("");
    try {
      // Persist current in-form edits + submit the report first, so the quote
      // prices from the latest findings (server reads stored readings).
      const cleaned = findings.filter((f) => f.zone || f.issue || f.note);
      await patch(`/api/inspections/${data.inspection.id}`, {
        findings: cleaned, summary, recommendation, status: "report_ready",
      });
      const r = await post<{ quote: { number: string | null }; existed?: boolean }>(`/api/quotes/from-inspection/${data.inspection.id}`, {});
      setJobMsg(r.existed ? `Quote ${r.quote.number} already exists ✓` : `Quote ${r.quote.number} created ✓ — see the Quotes tab to send`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full rounded-lg border border-white/10 bg-[#0b1530] px-2 py-1.5 text-sm text-white focus:border-blue-400 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0a1228] p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black">Site inspection</h2>
            {data?.contact?.name && (
              <p className="text-sm text-white/50">
                {data.contact.name}{data.lead?.service ? ` · ${data.lead.service}` : ""}{data.lead?.areaSqft ? ` · ${data.lead.areaSqft} sqft` : ""}
              </p>
            )}
            {data?.contact?.address && <p className="text-xs text-white/35">📍 {data.contact.address}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-white/50 hover:bg-white/5">✕</button>
        </div>

        {loading ? (
          <p className="text-white/50">Loading inspection…</p>
        ) : error && !data ? (
          <p className="font-semibold text-rose-300">Error: {error}</p>
        ) : (
          <div className="space-y-5">
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/50">Findings</h3>
              <div className="space-y-2">
                {findings.map((f, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input className={inp} placeholder="Zone (e.g. NE corner)" value={f.zone ?? ""} onChange={(e) => setF(i, "zone", e.target.value)} />
                      <input className={inp} placeholder="Issue (e.g. ponding, cracked screed)" value={f.issue ?? ""} onChange={(e) => setF(i, "issue", e.target.value)} />
                      <select className={inp} value={f.severity ?? "moderate"} onChange={(e) => setF(i, "severity", e.target.value)}>
                        {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input className={inp} placeholder="Note (optional)" value={f.note ?? ""} onChange={(e) => setF(i, "note", e.target.value)} />
                      <button onClick={() => delRow(i)} className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addRow} className="mt-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/5">+ Add finding</button>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/50">Summary</h3>
              <textarea className={`${inp} min-h-[70px]`} placeholder="Overall condition of the surface…" value={summary} onChange={(e) => { setSummary(e.target.value); setSavedMsg(""); }} />
            </section>
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/50">Recommendation</h3>
              <textarea className={`${inp} min-h-[70px]`} placeholder="Recommended system / scope of work…" value={recommendation} onChange={(e) => { setRecommendation(e.target.value); setSavedMsg(""); }} />
            </section>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
              <button onClick={() => save(false)} disabled={saving} className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-bold text-white/80 hover:bg-white/5 disabled:opacity-50">
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button onClick={() => save(true)} disabled={saving} className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50">
                Submit report
              </button>
              {isStaff && (
                <button onClick={generateQuote} disabled={saving} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
                  Generate quote
                </button>
              )}
              {savedMsg && <span className="text-sm font-semibold text-emerald-300">{savedMsg}</span>}
              {jobMsg && <span className="text-sm font-semibold text-emerald-300">{jobMsg}</span>}
              {error && <span className="text-sm font-semibold text-rose-300">{error}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
