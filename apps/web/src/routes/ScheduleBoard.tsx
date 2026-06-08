import { useEffect, useState } from "react";
import { get, patch } from "../lib/api";

interface Appt {
  id: string;
  status: string;
  scheduledDate: string | null;
  assignedTo: string | null;
  leadId: string;
  service: string | null;
  severity: string | null;
  areaSqft: number | null;
  contactName: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
}
interface Staff { userId: string; name: string | null; email: string | null; roles: string[] }

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

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function staffLabel(s: Staff): string {
  return (s.name || s.email || s.userId.slice(0, 8)) + (s.roles.includes("employee") ? "" : ` (${s.roles[0]})`);
}

export function ScheduleBoard() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unassigned" | "open">("open");

  useEffect(() => {
    let alive = true;
    Promise.all([
      get<{ appointments: Appt[] }>("/api/appointments"),
      get<{ staff: Staff[] }>("/api/appointments/staff"),
    ])
      .then(([a, s]) => { if (alive) { setAppts(a.appointments); setStaff(s.staff); } })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  async function assign(id: string, body: { assignedTo?: string | null; scheduledDate?: string | null }) {
    setBusy(id); setError("");
    try {
      await patch(`/api/appointments/${id}/assign`, body);
      setAppts((a) => a.map((x) => (x.id === id ? { ...x, ...body } as Appt : x)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-white/50">Loading schedule…</p>;
  if (error && !appts.length) return <p className="font-semibold text-rose-300">Error: {error}</p>;

  const staffName = (uid: string | null) => {
    if (!uid) return null;
    const s = staff.find((x) => x.userId === uid);
    return s ? (s.name || s.email || uid.slice(0, 8)) : uid.slice(0, 8);
  };
  const shown = appts.filter((a) => {
    if (filter === "unassigned") return !a.assignedTo;
    if (filter === "open") return a.status !== "completed" && a.status !== "cancelled";
    return true;
  });

  const inp = "rounded-lg border border-white/10 bg-[#0b1530] px-2 py-1.5 text-sm text-white focus:border-blue-400 focus:outline-none";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["open", "unassigned", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${
              filter === f ? "bg-blue-500 text-white" : "border border-white/10 text-white/55 hover:bg-white/5"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-white/35">{shown.length} visits</span>
      </div>
      {error && <p className="text-sm font-semibold text-rose-300">{error}</p>}

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/45">
          No site visits here. They appear when a lead books an inspection.
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{a.contactName || "Customer"}</p>
                  <p className="text-xs text-white/45">
                    {a.service || "Waterproofing"}{a.severity ? ` · ${a.severity}` : ""}{a.areaSqft ? ` · ${a.areaSqft} sqft` : ""}
                  </p>
                  {a.contactAddress && <p className="mt-0.5 text-xs text-white/35">📍 {a.contactAddress}</p>}
                  {a.contactPhone && <p className="text-xs text-white/35">📞 {a.contactPhone}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${STATUS_STYLE[a.status] ?? STATUS_STYLE.scheduled}`}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
                <label className="flex items-center gap-2 text-xs text-white/45">
                  Date
                  <input
                    type="datetime-local"
                    disabled={busy === a.id}
                    className={inp}
                    defaultValue={toLocalInput(a.scheduledDate)}
                    onChange={(e) => assign(a.id, { scheduledDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-white/45">
                  Crew
                  <select
                    disabled={busy === a.id}
                    className={inp}
                    value={a.assignedTo ?? ""}
                    onChange={(e) => assign(a.id, { assignedTo: e.target.value || null })}
                  >
                    <option value="">— Unassigned —</option>
                    {staff.map((s) => (
                      <option key={s.userId} value={s.userId}>{staffLabel(s)}</option>
                    ))}
                  </select>
                </label>
                {a.assignedTo && <span className="text-xs font-semibold text-emerald-300/80">→ {staffName(a.assignedTo)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
