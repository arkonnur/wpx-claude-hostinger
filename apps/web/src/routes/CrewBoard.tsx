import { useEffect, useState } from "react";
import { get, patch } from "../lib/api";
import { InspectionForm } from "./InspectionForm";

interface Appt {
  id: string;
  status: string;
  scheduledDate: string | null;
  assignedTo: string | null;
  leadId: string;
  service: string | null;
  severity: string | null;
  areaSqft: number | null;
  leadStatus: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  confirmed: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  in_progress: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  completed: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  cancelled: "bg-white/10 text-white/40 ring-white/20",
  no_show: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};
const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled", confirmed: "Confirmed", in_progress: "On site",
  completed: "Done", cancelled: "Cancelled", no_show: "No show",
};
// What a crew member can move a visit to, given its current state.
const NEXT: Record<string, { to: string; label: string }[]> = {
  scheduled: [{ to: "confirmed", label: "Confirm" }, { to: "no_show", label: "No show" }],
  confirmed: [{ to: "in_progress", label: "Start visit" }, { to: "no_show", label: "No show" }],
  in_progress: [{ to: "completed", label: "Mark done" }],
  completed: [],
  cancelled: [],
  no_show: [],
};

function fmtDate(iso: string | null): string {
  if (!iso) return "Unscheduled";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Unscheduled";
  return d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function CrewBoard() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [inspectAppt, setInspectAppt] = useState<string | null>(null);

  function load() {
    get<{ appointments: Appt[] }>("/api/appointments/mine")
      .then((r) => setAppts(r.appointments))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function move(id: string, to: string) {
    setBusy(id); setError("");
    try {
      await patch(`/api/appointments/${id}/status`, { status: to });
      setAppts((a) => a.map((x) => (x.id === id ? { ...x, status: to } : x)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-white/50">Loading visits…</p>;
  if (error && !appts.length) return <p className="font-semibold text-rose-300">Error: {error}</p>;

  const open = appts.filter((a) => a.status !== "completed" && a.status !== "cancelled" && a.status !== "no_show");
  const today = open.filter((a) => isToday(a.scheduledDate));
  const upcoming = open.filter((a) => !isToday(a.scheduledDate));
  const done = appts.filter((a) => a.status === "completed" || a.status === "cancelled" || a.status === "no_show");

  const Card = (a: Appt) => (
    <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{a.contactName || "Customer"}</p>
          <p className="text-xs text-white/45">
            {a.service || "Waterproofing"}{a.severity ? ` · ${a.severity}` : ""}{a.areaSqft ? ` · ${a.areaSqft} sqft` : ""}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${STATUS_STYLE[a.status] ?? STATUS_STYLE.scheduled}`}>
          {STATUS_LABEL[a.status] ?? a.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/60">📅 {fmtDate(a.scheduledDate)}</p>
      {a.contactAddress && <p className="mt-1 text-xs text-white/40">📍 {a.contactAddress}</p>}
      {a.contactPhone && (
        <a href={`tel:${a.contactPhone}`} className="mt-1 inline-block text-xs font-semibold text-blue-300 hover:underline">
          📞 {a.contactPhone}
        </a>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {(NEXT[a.status] ?? []).map((n) => (
          <button
            key={n.to}
            disabled={busy === a.id}
            onClick={() => move(a.id, n.to)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
              n.to === "no_show"
                ? "border border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {n.label}
          </button>
        ))}
        {(a.status === "confirmed" || a.status === "in_progress" || a.status === "completed") && (
          <button
            onClick={() => setInspectAppt(a.id)}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/5"
          >
            📋 Inspection
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {error && <p className="text-sm font-semibold text-rose-300">{error}</p>}
      {appts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/45">
          No visits assigned yet. Your admin will schedule and assign site visits to you.
        </div>
      )}

      {today.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-amber-300/80">Today · {today.length}</h2>
          <div className="grid gap-3 md:grid-cols-2">{today.map(Card)}</div>
        </section>
      )}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Upcoming · {upcoming.length}</h2>
          <div className="grid gap-3 md:grid-cols-2">{upcoming.map(Card)}</div>
        </section>
      )}
      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/40">Completed · {done.length}</h2>
          <div className="grid gap-3 md:grid-cols-2 opacity-60">{done.map(Card)}</div>
        </section>
      )}

      {inspectAppt && <InspectionForm apptId={inspectAppt} onClose={() => setInspectAppt(null)} />}
    </div>
  );
}
