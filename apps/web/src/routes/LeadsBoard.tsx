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

interface TimelineLead {
  id: string; service: string | null; severity: string | null; areaSqft: number | null;
  status: string; source: string | null; score: number | null;
  scoreTier: "hot" | "warm" | "cold" | null; utm: { notes?: string } | null; createdAt: string | null;
}
interface TimelineEvent { id: string; type: string; payload: Record<string, unknown> | null; createdAt: string | null }
interface Timeline {
  contact: {
    id: string; name: string | null; phone: string | null; email: string | null;
    address: string | null; verifiedAt: string | null; hasAccount: boolean; createdAt: string | null;
  };
  leads: TimelineLead[];
  events: TimelineEvent[];
}

function LeadCard({ lead, onStatus, onOpen }: { lead: Lead; onStatus: (id: string, status: string) => void; onOpen: (id: string) => void }) {
  const tier = lead.scoreTier ?? "cold";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onOpen(lead.id)} className="min-w-0 text-left">
          <p className="truncate font-bold text-white hover:underline">{lead.name || "Unknown"}</p>
          {lead.phone && <span className="text-xs text-[#60a5fa]">{lead.phone}</span>}
        </button>
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

const EVENT_LABEL: Record<string, string> = {
  tool_view: "Viewed tool", calculator_run: "Ran calculator", estimate_view: "Viewed exact estimate",
  diagnose_start: "Started AI diagnosis", diagnose_result: "Got AI diagnosis", report_view: "Viewed health report",
  warranty_check: "Checked warranty", book_open: "Opened booking", lead_submit: "Submitted a lead",
  otp_verified: "Verified mobile (OTP)", signup: "Created account", login: "Logged in",
};

function TimelineDrawer({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [data, setData] = useState<Timeline | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let alive = true;
    setData(null); setErr("");
    get<Timeline>(`/api/leads/${leadId}/timeline`)
      .then((r) => alive && setData(r))
      .catch((e) => alive && setErr((e as Error).message));
    return () => { alive = false; };
  }, [leadId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="presentation" onClick={onClose} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0b1530] p-6" role="presentation" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black">Contact timeline</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>
        {err && <p className="text-rose-300">{err}</p>}
        {!data && !err && <p className="text-white/50">Loading…</p>}
        {data && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-base font-bold">{data.contact.name || "Unknown"}</p>
              <div className="mt-1 space-y-0.5 text-sm text-white/55">
                {data.contact.phone && <p>{data.contact.phone}</p>}
                {data.contact.email && <p>{data.contact.email}</p>}
                {data.contact.address && <p>{data.contact.address}</p>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                {data.contact.verifiedAt && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300 ring-1 ring-emerald-400/30">Verified</span>}
                {data.contact.hasAccount && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-300 ring-1 ring-violet-400/30">Account</span>}
              </div>
            </div>

            <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-white/50">Leads ({data.leads.length})</h3>
            <div className="space-y-2">
              {data.leads.map((l) => (
                <div key={l.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{l.service || "—"}{l.severity ? ` · ${l.severity}` : ""}</span>
                    <span className="text-xs text-white/40">{timeAgo(l.createdAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${TIER_STYLE[l.scoreTier ?? "cold"]}`}>
                      {(l.scoreTier ?? "cold")} · {l.score ?? 0}
                    </span>
                    <span>{l.status}</span>
                    {l.areaSqft ? <span>· {l.areaSqft} sqft</span> : null}
                  </div>
                  {l.utm?.notes && <p className="mt-1 text-xs text-white/40">{l.utm.notes}</p>}
                </div>
              ))}
            </div>

            <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-white/50">Activity ({data.events.length})</h3>
            <div className="space-y-1.5">
              {data.events.length === 0 && <p className="text-sm text-white/30">No tracked activity yet.</p>}
              {data.events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-white/70">{EVENT_LABEL[ev.type] ?? ev.type}</span>
                  <span className="shrink-0 text-xs text-white/35">{timeAgo(ev.createdAt)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function LeadsBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mutErr, setMutErr] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

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
    setMutErr("");
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l))); // optimistic
    try {
      await patch(`/api/leads/${id}`, { status });
    } catch (e) {
      // Roll back ONLY this lead (don't clobber concurrent edits to others).
      if (prevStatus !== undefined) {
        setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: prevStatus } : l)));
      }
      // Non-blocking: a failed PATCH must not blank the whole board.
      setMutErr((e as Error).message);
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
  if (error && !leads.length) return <p className="font-semibold text-rose-300">Error: {error}</p>;

  return (
    <div>
      {mutErr && <p className="mb-3 text-sm font-semibold text-rose-300">Couldn't update: {mutErr}</p>}
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
                <LeadCard key={l.id} lead={l} onStatus={changeStatus} onOpen={setOpenId} />
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
                <LeadCard key={l.id} lead={l} onStatus={changeStatus} onOpen={setOpenId} />
              ))}
            </div>
          </div>
        )}
      </div>

      {openId && <TimelineDrawer leadId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
