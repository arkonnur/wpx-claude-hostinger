import { useState } from "react";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";
import { ToolShell } from "./ToolShell";

const SERVICES = [
  "Terrace / Roof",
  "Bathroom",
  "Swimming pool",
  "Water tank",
  "Exterior wall",
  "Dampness treatment",
  "Not sure — need advice",
];

const field =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#002bfa]/60 focus:outline-none focus:ring-2 focus:ring-[#002bfa]/30";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/45";

export function BookVisit() {
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    area: "",
    service: SERVICES[0] as string,
    date: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid = form.name.trim() && /^\d{10}$/.test(form.phone.replace(/\D/g, ""));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    // Booking endpoint lands with the CRM build (Phase 6). Capture + confirm for now.
    setDone(true);
  }

  if (done) {
    return (
      <ToolShell
        title="Free Site Inspection"
        subtitle="A WaterProofX engineer surveys your site — no charge, no obligation."
        gate="Free"
        icon={<ClipboardCheck className="h-6 w-6" />}
      >
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.06] p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
          <h2 className="mt-4 text-xl font-bold">Request received</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Thanks {form.name.split(" ")[0]} — our team will WhatsApp you on{" "}
            {form.phone} to lock a slot for your {form.service.toLowerCase()} inspection
            in {form.area || "your area"}.
          </p>
          <button
            onClick={() => setDone(false)}
            className="mt-6 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Book another
          </button>
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell
      title="Free Site Inspection"
      subtitle="Moisture mapping, slope & crack survey by a certified engineer — at no cost."
      gate="Free"
      icon={<ClipboardCheck className="h-6 w-6" />}
    >
      <form onSubmit={submit} className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-2">
        <div>
          <label className={label}>Full name</label>
          <input className={field} value={form.name} onChange={set("name")} placeholder="Your name" />
        </div>
        <div>
          <label className={label}>Mobile (WhatsApp)</label>
          <input className={field} value={form.phone} onChange={set("phone")} placeholder="10-digit number" inputMode="numeric" />
        </div>
        <div>
          <label className={label}>Area / locality</label>
          <input className={field} value={form.area} onChange={set("area")} placeholder="e.g. Whitefield" />
        </div>
        <div>
          <label className={label}>Service needed</label>
          <select className={field} value={form.service} onChange={set("service")}>
            {SERVICES.map((s) => (
              <option key={s} value={s} className="bg-[#0b1530]">
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Preferred date</label>
          <input type="date" className={field} value={form.date} onChange={set("date")} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Notes (optional)</label>
          <textarea className={field} rows={3} value={form.notes} onChange={set("notes")} placeholder="Describe the problem — leak location, how long, etc." />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!valid}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#002bfa] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1d44ff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Book free inspection
          </button>
          <p className="mt-3 text-center text-xs text-white/40">
            No spam. We only message you about this inspection.
          </p>
        </div>
      </form>
    </ToolShell>
  );
}
