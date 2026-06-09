import { useEffect, useState } from "react";
import { get } from "../lib/api";
import { QuoteView } from "./QuoteView";

interface QuoteRow {
  id: string; number: string | null; status: string; total: string | null;
  validUntil: string | null; createdAt: string | null; contactName?: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-white/10 text-white/50 ring-white/20",
  sent: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  accepted: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  expired: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};
const inr = (v: string | null) => "₹" + Math.round(Number(v ?? 0)).toLocaleString("en-IN");

/** scope="all" → admin/owner tenant quotes; scope="mine" → client's own. */
export function QuotesBoard({ scope }: { scope: "all" | "mine" }) {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  function load() {
    get<{ quotes: QuoteRow[] }>(scope === "mine" ? "/api/quotes/mine" : "/api/quotes")
      .then((r) => setRows(r.quotes))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [scope]);

  if (loading) return <p className="text-white/50">Loading quotes…</p>;
  if (error && !rows.length) return <p className="font-semibold text-rose-300">Error: {error}</p>;

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/45">
          {scope === "mine" ? "No quotes yet. After a site inspection we'll send your priced quote here." : "No quotes yet. Generate one from a submitted inspection report (Site visits → Report)."}
        </div>
      ) : (
        rows.map((q) => (
          <button key={q.id} onClick={() => setOpenId(q.id)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-blue-400/40">
            <div>
              <p className="font-bold">{q.number}{q.contactName ? ` · ${q.contactName}` : ""}</p>
              <p className="text-xs text-white/40">{q.validUntil ? `Valid until ${new Date(q.validUntil).toLocaleDateString("en-IN")}` : "Draft — not sent"}</p>
            </div>
            <div className="text-right">
              <p className="font-black">{inr(q.total)}</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${STATUS_STYLE[q.status] ?? STATUS_STYLE.draft}`}>{q.status}</span>
            </div>
          </button>
        ))
      )}
      {openId && <QuoteView quoteId={openId} onClose={() => setOpenId(null)} onChange={load} />}
    </div>
  );
}
