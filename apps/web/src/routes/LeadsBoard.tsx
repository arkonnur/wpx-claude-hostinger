import { useEffect, useMemo, useState } from "react";
import { get, patch } from "../lib/api";

interface Lead {
  id: string;
  service: string | null;
  severity: string | null;
  areaSqft: number | null;
  status: string;
  source: string | null;
  score: number | null;
  scoreTier: "hot" | "warm" | "cold" | null;
  utm: { notes?: string } | null;
  createdAt: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  contactId: string | null;
}

const STATUSES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "site_visit_scheduled", label: "Site visit" },
  { key: "quoted", label: "Quoted" },
  { key: "converted", label: "Won" },
  { key: "lost", label: "Lost" },
] as const;

const TIER_STYLE: Record<string, string> = {
  hot: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  warm: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  cold: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function LeadCard({ lead, onStatus }: { lead: Lead; onStatus: (id: string, status: string) => void }) {
  const tier = lead.scoreTier ?? "cold";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{lead.name || "Unknown"}</p>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="text-xs text-[#60a5fa] hover:underline">
              {lead.phone}
            </a>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${TIER_STYLE[tier]}`}>
          {tier} · {lead.score ?? 0}
        </span>
      </div>

      <div className="mt-2 space-y-0.5 text-xs text-white/55">
        {lead.service && <p>{lead.service}{lead.severity ? ` · ${lead.severity}` : ""}</p>}
        {lead.areaSqft ? <p>{lead.areaSqft} sqft</p> : null}
        {lead.utm?.notes && <p className="text-white/45">{lead.utm.notes}</p>}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-white/30">
          {lead.source} · {timeAgo(lead.createdAt)}
        </span>
        <select
          value={lead.status}
          onChange={(e) => onStatus(lead.id, e.target.value)}
          className="rounded-lg border border-white/10 bg-[#0b1530] px-2 py-1 text-[11px] text-white focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function LeadsBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    get<{ leads: Lead[] }>("/api/leads")
      .then((r) => alive && setLeads(r.leads))
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function changeStatus(id: string, status: string) {
    const prevStatus = leads.find((l) => l.id === id)?.status;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l))); // optimistic
    try {
      await patch(`/api/leads/${id}`, { status });
    } catch (e) {
      // Roll back ONLY this lead (don't clobber concurrent edits to others).
      if (prevStatus !== undefined) {
        setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: prevStatus } : l)));
      }
      setError((e as Error).message);
    }
  }

  const { byStatus, other } = useMemo(() => {
    const known = new Set<string>(STATUSES.map((s) => s.key));
    const m: Record<string, Lead[]> = {};
    for (const s of STATUSES) m[s.key] = [];
    const o: Lead[] = [];
    for (const l of leads) (known.has(l.status) ? m[l.status]! : o).push(l);
    return { byStatus: m, other: o };
  }, [leads]);

  const hot = leads.filter((l) => l.scoreTier === "hot").length;

  if (loading) return <p className="text-white/50">Loading leads…</p>;
  if (error) return <p className="font-semibold text-rose-300">Error: {error}</p>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-white/5 px-3 py-1 font-semibold">{leads.length} leads</span>
        <span className="rounded-full bg-rose-500/15 px-3 py-1 font-semibold text-rose-300">{hot} hot</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {STATUSES.map((s) => (
          <div key={s.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-2.5">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">{s.label}</span>
              <span className="text-xs text-white/30">{byStatus[s.key]?.length ?? 0}</span>
            </div>
            <div className="space-y-2">
              {(byStatus[s.key] ?? []).map((l) => (
                <LeadCard key={l.id} lead={l} onStatus={changeStatus} />
              ))}
              {(byStatus[s.key]?.length ?? 0) === 0 && (
                <p className="px-1 py-3 text-center text-xs text-white/20">—</p>
              )}
            </div>
          </div>
        ))}
        {other.length > 0 && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] p-2.5">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80">Other</span>
              <span className="text-xs text-white/30">{other.length}</span>
            </div>
            <div className="space-y-2">
              {other.map((l) => (
                <LeadCard key={l.id} lead={l} onStatus={changeStatus} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
