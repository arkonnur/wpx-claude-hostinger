import { useEffect, useState } from "react";
import { get } from "../lib/api";

interface MyLead {
  id: string; service: string | null; severity: string | null; areaSqft: number | null;
  status: string; source: string | null; createdAt: string | null; utm: { notes?: string } | null;
}
interface MyEvent { id: string; type: string; createdAt: string | null }

const STATUS_LABEL: Record<string, string> = {
  new: "Received", contacted: "We reached out", site_visit_scheduled: "Site visit booked",
  quoted: "Quote sent", converted: "Confirmed", lost: "Closed",
};
const STATUS_STYLE: Record<string, string> = {
  new: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  contacted: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  site_visit_scheduled: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  quoted: "bg-blue-500/15 text-blue-300 ring-blue-400/30",
  converted: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  lost: "bg-white/10 text-white/40 ring-white/20",
};
const EVENT_LABEL: Record<string, string> = {
  tool_view: "Viewed a tool", calculator_run: "Used the cost calculator", estimate_view: "Viewed an exact estimate",
  diagnose_start: "Started AI diagnosis", diagnose_result: "Got AI diagnosis", report_view: "Viewed health report",
  warranty_check: "Checked warranty", lead_submit: "Submitted a request",
  otp_verified: "Verified mobile", signup: "Created account", login: "Signed in",
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

export function MyRequests() {
  const [leads, setLeads] = useState<MyLead[]>([]);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    get<{ leads: MyLead[]; events: MyEvent[] }>("/api/leads/mine")
      .then((r) => { if (alive) { setLeads(r.leads); setEvents(r.events); } })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  if (loading) return <p className="text-white/50">Loading…</p>;
  if (error) return <p className="font-semibold text-rose-300">Error: {error}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">My requests</h2>
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/45">
            No requests yet. Use the tools to get a quote or book a free inspection.
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((l) => (
              <div key={l.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{l.service || "Waterproofing request"}{l.severity ? ` · ${l.severity}` : ""}</p>
                    {l.areaSqft ? <p className="text-xs text-white/45">{l.areaSqft} sqft</p> : null}
                    {l.utm?.notes && <p className="mt-1 text-xs text-white/40">{l.utm.notes}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${STATUS_STYLE[l.status] ?? STATUS_STYLE.new}`}>
                    {STATUS_LABEL[l.status] ?? l.status}
                  </span>
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-white/30">{timeAgo(l.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Recent activity</h2>
        <div className="space-y-1.5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          {events.length === 0 && <p className="text-sm text-white/30">Nothing yet.</p>}
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-white/70">{EVENT_LABEL[ev.type] ?? ev.type}</span>
              <span className="shrink-0 text-xs text-white/35">{timeAgo(ev.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
