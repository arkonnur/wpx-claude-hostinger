import { useEffect, useState } from "react";
import { get, post, patch } from "../lib/api";
import { useSession } from "../lib/session";

interface LineItem { description: string; areaSqft: number; ratePerSqft: number; amount: number }
interface Quote {
  id: string; number: string | null; status: string;
  lineItems: LineItem[] | null; subtotal: string | null; gst: string | null; total: string | null;
  validUntil: string | null; priceSnapshot: unknown;
  contactId: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-white/10 text-white/50 ring-white/20",
  sent: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  accepted: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  expired: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

const inr = (v: string | number | null) => "₹" + Math.round(Number(v ?? 0)).toLocaleString("en-IN");

export function QuoteView({ quoteId, onClose, onChange }: { quoteId: string; onClose: () => void; onChange?: () => void }) {
  const { role } = useSession();
  const isStaff = role === "admin" || role === "owner";
  const [q, setQ] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function load() {
    get<{ quote: Quote }>(`/api/quotes/${quoteId}`)
      .then((r) => setQ(r.quote))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [quoteId]);

  async function setStatus(status: string) {
    setBusy(true); setError(""); setMsg("");
    try { await patch(`/api/quotes/${quoteId}/status`, { status }); load(); onChange?.(); setMsg(status === "sent" ? "Sent — price locked ✓" : `Marked ${status}`); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function accept() {
    setBusy(true); setError(""); setMsg("");
    try { const r = await post<{ jobId: string }>(`/api/quotes/${quoteId}/accept`, {}); load(); onChange?.(); setMsg(`Accepted ✓ — job ${r.jobId.slice(0, 8)} created`); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const frozen = !!q?.priceSnapshot;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0a1228] p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black">Quote {q?.number ?? ""}</h2>
            {q && (
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${STATUS_STYLE[q.status] ?? STATUS_STYLE.draft}`}>
                {q.status}{frozen ? " · price locked" : ""}
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-white/50 hover:bg-white/5">✕</button>
        </div>

        {loading ? <p className="text-white/50">Loading…</p> : error && !q ? (
          <p className="font-semibold text-rose-300">Error: {error}</p>
        ) : q && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wider text-white/40">
                  <tr><th className="px-4 py-2 font-semibold">Item</th><th className="px-2 py-2 text-right font-semibold">Area</th><th className="px-2 py-2 text-right font-semibold">Rate</th><th className="px-4 py-2 text-right font-semibold">Amount</th></tr>
                </thead>
                <tbody>
                  {(q.lineItems ?? []).map((li, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-4 py-2 text-white/80">{li.description}</td>
                      <td className="px-2 py-2 text-right text-white/55">{li.areaSqft} sqft</td>
                      <td className="px-2 py-2 text-right text-white/55">₹{li.ratePerSqft}</td>
                      <td className="px-4 py-2 text-right font-semibold">{inr(li.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between text-white/55"><span>Subtotal</span><span>{inr(q.subtotal)}</span></div>
              <div className="flex justify-between text-white/55"><span>GST</span><span>{inr(q.gst)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-1 text-base font-black"><span>Total</span><span>{inr(q.total)}</span></div>
            </div>

            {q.validUntil && <p className="text-xs text-white/35">Valid until {new Date(q.validUntil).toLocaleDateString("en-IN")}. Accepted price is frozen and never revised.</p>}
            {msg && <p className="text-sm font-semibold text-emerald-300">{msg}</p>}
            {error && <p className="text-sm font-semibold text-rose-300">{error}</p>}

            <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
              {isStaff && q.status === "draft" && (
                <button disabled={busy} onClick={() => setStatus("sent")} className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50">Send to customer</button>
              )}
              {isStaff && (q.status === "sent" || q.status === "draft") && (
                <button disabled={busy} onClick={() => setStatus("rejected")} className="rounded-xl border border-rose-400/30 px-4 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">Reject</button>
              )}
              {(q.status === "sent" || (isStaff && q.status === "draft")) && (
                <button disabled={busy} onClick={accept} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
                  {isStaff ? "Accept (on behalf)" : "Accept quote"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
