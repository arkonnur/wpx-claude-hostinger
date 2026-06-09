import { useEffect, useState } from "react";
import { get, put } from "../lib/api";

/* ─────────────────────────────── Overview ─────────────────────────────── */

interface Overview {
  leads: { total: number; byStatus: Record<string, number> };
  jobs: { total: number; byStatus: Record<string, number> };
  contacts: number;
  appointments: number;
  inspections: number;
  quotes: { accepted: number; acceptedValue: number };
  warranties: number;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-white/45">{hint}</p>}
    </div>
  );
}

export function OwnerOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    get<Overview>("/api/config/overview")
      .then((r) => alive && setData(r))
      .catch((e) => alive && setError((e as Error).message));
    return () => { alive = false; };
  }, []);

  if (error) return <p className="font-semibold text-rose-300">Error: {error}</p>;
  if (!data) return <p className="text-white/50">Loading overview…</p>;

  const pipeline = Object.entries(data.leads.byStatus);
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Leads" value={data.leads.total} hint="all-time" />
        <Kpi label="Contacts" value={data.contacts} />
        <Kpi label="Site visits" value={data.appointments} />
        <Kpi label="Inspections" value={data.inspections} />
        <Kpi label="Jobs" value={data.jobs.total} />
        <Kpi label="Quotes won" value={data.quotes.accepted} hint={inr(data.quotes.acceptedValue)} />
        <Kpi label="Warranties" value={data.warranties} hint="cards issued" />
        <Kpi label="Won value" value={inr(data.quotes.acceptedValue)} hint="accepted quotes" />
      </div>

      {pipeline.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Lead pipeline</h3>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {pipeline.map(([k, n]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="text-lg font-black">{n}</p>
                <p className="text-[11px] capitalize text-white/45">{k.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.jobs.total > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Jobs by stage</h3>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(data.jobs.byStatus).map(([k, n]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="text-lg font-black">{n}</p>
                <p className="text-[11px] capitalize text-white/45">{k.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ──────────────────────────── Tenant / org ────────────────────────────── */

interface Tenant {
  id: string;
  name: string;
  slug: string;
  branding: { accent?: string } | null;
  status: string;
  createdAt: string | null;
}

export function TenantSettings() {
  const [t, setT] = useState<Tenant | null>(null);
  const [name, setName] = useState("");
  const [accent, setAccent] = useState("#002bfa");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    get<{ tenant: Tenant }>("/api/config/tenant")
      .then((r) => {
        if (!alive) return;
        setT(r.tenant);
        setName(r.tenant.name);
        setAccent(r.tenant.branding?.accent ?? "#002bfa");
      })
      .catch((e) => alive && setError((e as Error).message));
    return () => { alive = false; };
  }, []);

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const r = await put<{ ok: true; tenant: Tenant }>("/api/config/tenant", {
        name,
        branding: { ...(t?.branding ?? {}), accent },
      });
      setT(r.tenant);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !t) return <p className="font-semibold text-rose-300">Error: {error}</p>;
  if (!t) return <p className="text-white/50">Loading organisation…</p>;

  const field = "w-full rounded-lg border border-white/10 bg-[#0b1530] px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none";
  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">Organisation</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${t.status === "active" ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" : "bg-amber-500/15 text-amber-300 ring-amber-400/30"}`}>
            {t.status}
          </span>
        </div>

        <label className="mt-4 block text-xs font-semibold text-white/55">
          Business name
          <input className={`${field} mt-1`} value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} maxLength={191} />
        </label>

        <label className="mt-4 block text-xs font-semibold text-white/55">
          Workspace slug (read-only)
          <input className={`${field} mt-1 opacity-60`} value={t.slug} readOnly />
        </label>

        <label className="mt-4 block text-xs font-semibold text-white/55">
          Brand accent
          <div className="mt-1 flex items-center gap-3">
            <input type="color" className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" value={accent} onChange={(e) => { setAccent(e.target.value); setSaved(false); }} />
            <input className={field} value={accent} onChange={(e) => { setAccent(e.target.value); setSaved(false); }} maxLength={9} />
          </div>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving || !name.trim()} className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50">
          {saving ? "Saving…" : "Save organisation"}
        </button>
        {saved && <span className="text-sm font-semibold text-emerald-300">Saved ✓</span>}
        {error && <span className="text-sm font-semibold text-rose-300">{error}</span>}
      </div>
    </div>
  );
}

/* ───────────────────────────────── Billing ────────────────────────────── */

interface PlanInfo { label: string; priceInr: number; limits: { leads: number; jobs: number } }
interface Billing {
  plan: PlanInfo & { key: string };
  usage: { leads: number; jobs: number };
  plans: Record<string, PlanInfo>;
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const hot = pct >= 90;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className={hot ? "font-bold text-rose-300" : "text-white/45"}>{used} / {limit}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${hot ? "bg-rose-400" : "bg-blue-400"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BillingPanel() {
  const [data, setData] = useState<Billing | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    get<Billing>("/api/config/billing")
      .then((r) => alive && setData(r))
      .catch((e) => alive && setError((e as Error).message));
    return () => { alive = false; };
  }, []);

  if (error) return <p className="font-semibold text-rose-300">Error: {error}</p>;
  if (!data) return <p className="text-white/50">Loading billing…</p>;

  const order = ["starter", "growth", "scale"];
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">Current plan</p>
            <p className="mt-0.5 text-2xl font-black">{data.plan.label}</p>
          </div>
          <p className="text-right text-sm text-white/50">
            {data.plan.priceInr === 0 ? "Free" : <>{inr(data.plan.priceInr)}<span className="text-white/35">/mo</span></>}
          </p>
        </div>
        <div className="mt-5 space-y-4">
          <UsageBar label="Leads" used={data.usage.leads} limit={data.plan.limits.leads} />
          <UsageBar label="Jobs" used={data.usage.jobs} limit={data.plan.limits.jobs} />
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Plans</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {order.filter((k) => data.plans[k]).map((k) => {
            const p = data.plans[k]!;
            const current = k === data.plan.key;
            return (
              <div key={k} className={`rounded-2xl border p-4 ${current ? "border-blue-400/50 bg-blue-500/10" : "border-white/10 bg-white/[0.02]"}`}>
                <div className="flex items-center justify-between">
                  <p className="font-black">{p.label}</p>
                  {current && <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-200">Current</span>}
                </div>
                <p className="mt-1 text-lg font-black">{p.priceInr === 0 ? "Free" : <>{inr(p.priceInr)}<span className="text-xs font-normal text-white/40">/mo</span></>}</p>
                <ul className="mt-3 space-y-1 text-xs text-white/55">
                  <li>{p.limits.leads.toLocaleString("en-IN")} leads</li>
                  <li>{p.limits.jobs.toLocaleString("en-IN")} jobs</li>
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-white/40">
          To change plans, contact your account manager. Payments are processed out-of-band — no card details are stored in the app.
        </p>
      </section>
    </div>
  );
}
