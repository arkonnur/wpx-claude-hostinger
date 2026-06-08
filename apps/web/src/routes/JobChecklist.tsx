import { useEffect, useState } from "react";
import { get, post, patch } from "../lib/api";
import { useSession } from "../lib/session";

interface Item {
  id: string; zone: string; label: string; status: string;
  material: string | null; batchNo: string | null; quantity: string | null;
  coverage: string | null; crew: string | null; weather: string | null;
  qaVerified: boolean;
}
interface Warranty { cardNo: string; qrToken: string; years: number | null; brand: string | null; expiryDate: string | null }
interface JobData {
  job: { id: string; status: string; assignedTo: string | null; contactName: string | null; contactAddress: string | null; contactPhone: string | null };
  items: Item[];
  warranty: Warranty | null;
}

const ITEM_STYLE: Record<string, string> = {
  pending: "bg-white/5 text-white/50 ring-white/15",
  done: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  na: "bg-white/10 text-white/35 ring-white/20",
};
const EVIDENCE: { k: keyof Item; label: string }[] = [
  { k: "material", label: "Material" }, { k: "batchNo", label: "Batch no" },
  { k: "quantity", label: "Qty used" }, { k: "coverage", label: "Coverage" },
  { k: "crew", label: "Crew" }, { k: "weather", label: "Weather" },
];

export function JobChecklist({ jobId, onClose, onChange }: { jobId: string; onClose: () => void; onChange?: () => void }) {
  const { role } = useSession();
  const isStaff = role === "admin" || role === "owner";
  const [data, setData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [years, setYears] = useState(5);
  const [brand, setBrand] = useState("");

  function load() {
    get<JobData>(`/api/jobs/${jobId}`)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [jobId]);

  function patchItemLocal(id: string, p: Partial<Item>) {
    setData((d) => d && ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }));
  }
  async function setItem(id: string, body: Partial<Item>) {
    setBusy(id); setError("");
    try { await patch(`/api/jobs/items/${id}`, body); patchItemLocal(id, body); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(null); }
  }
  async function qa(id: string, v: boolean) {
    setBusy(id);
    try { await patch(`/api/jobs/items/${id}/qa`, { qaVerified: v }); patchItemLocal(id, { qaVerified: v }); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(null); }
  }
  async function issueWarranty() {
    setBusy("warranty"); setError("");
    try {
      const r = await post<{ warranty: Warranty }>(`/api/jobs/${jobId}/warranty`, { years, brand });
      setData((d) => d && ({ ...d, warranty: r.warranty, job: { ...d.job, status: "warranty_issued" } }));
      onChange?.();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(null); }
  }

  const allDone = !!data?.items.length && data.items.every((i) => i.status !== "pending");
  const allQa = !!data?.items.length && data.items.every((i) => i.status === "na" || i.qaVerified);

  const inp = "w-full rounded-lg border border-white/10 bg-[#0b1530] px-2 py-1 text-xs text-white focus:border-blue-400 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0a1228] p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black">Execution checklist</h2>
            {data?.job.contactName && <p className="text-sm text-white/50">{data.job.contactName}</p>}
            {data?.job.contactAddress && <p className="text-xs text-white/35">📍 {data.job.contactAddress}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-white/50 hover:bg-white/5">✕</button>
        </div>

        {loading ? <p className="text-white/50">Loading…</p> : error && !data ? (
          <p className="font-semibold text-rose-300">Error: {error}</p>
        ) : data && (
          <div className="space-y-4">
            {data.items.map((it) => (
              <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{it.label}</p>
                    <p className="text-xs text-white/45">{it.zone}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${ITEM_STYLE[it.status] ?? ITEM_STYLE.pending}`}>
                    {it.status}{it.qaVerified ? " · QA✓" : ""}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {EVIDENCE.map(({ k, label }) => (
                    <label key={k} className="text-[10px] uppercase tracking-wider text-white/40">
                      {label}
                      <input
                        className={inp}
                        defaultValue={(it[k] as string) ?? ""}
                        disabled={busy === it.id || it.qaVerified}
                        onBlur={(e) => { const v = e.target.value; if (v !== ((it[k] as string) ?? "")) setItem(it.id, { [k]: v } as Partial<Item>); }}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {it.status !== "done" && (
                    <button disabled={busy === it.id || it.qaVerified} onClick={() => setItem(it.id, { status: "done" })}
                      className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-50">Mark done</button>
                  )}
                  {it.status !== "na" && (
                    <button disabled={busy === it.id || it.qaVerified} onClick={() => setItem(it.id, { status: "na" })}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white/60 hover:bg-white/5 disabled:opacity-50">N/A</button>
                  )}
                  {isStaff && it.status === "done" && (
                    <button disabled={busy === it.id} onClick={() => qa(it.id, !it.qaVerified)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${it.qaVerified ? "border border-white/15 text-white/60 hover:bg-white/5" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                      {it.qaVerified ? "Undo QA" : "QA verify"}</button>
                  )}
                </div>
              </div>
            ))}

            {error && <p className="text-sm font-semibold text-rose-300">{error}</p>}

            {isStaff && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/50">Warranty</h3>
                {data.warranty ? (
                  <div className="text-sm">
                    <p className="font-black text-emerald-300">{data.warranty.cardNo}</p>
                    <p className="text-xs text-white/45">{data.warranty.years} yr{data.warranty.brand ? ` · ${data.warranty.brand}` : ""}{data.warranty.expiryDate ? ` · expires ${new Date(data.warranty.expiryDate).toLocaleDateString("en-IN")}` : ""}</p>
                    <p className="mt-1 break-all text-[10px] text-white/30">Verify: /warranty/{data.warranty.qrToken}</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="text-[10px] uppercase tracking-wider text-white/40">Years
                      <input type="number" min={1} max={20} className={`${inp} w-20`} value={years} onChange={(e) => setYears(Number(e.target.value))} /></label>
                    <label className="text-[10px] uppercase tracking-wider text-white/40">Brand
                      <input className={`${inp} w-40`} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Dr. Fixit / Fosroc…" /></label>
                    <button disabled={busy === "warranty" || !allDone || !allQa} onClick={issueWarranty}
                      className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-40">
                      Issue warranty card</button>
                    {(!allDone || !allQa) && <span className="text-xs text-white/35">All items must be done + QA-verified first.</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
