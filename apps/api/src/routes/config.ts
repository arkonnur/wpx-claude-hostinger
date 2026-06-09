// Owner config — live pricing. Owner edits propagate to every calculator.
import { Hono } from "hono";
import { and, eq, count, sum } from "drizzle-orm";
import { getDb, leads, contacts, appointments, inspections, jobs, quotes, warranties, tenants, orgSettings } from "@wpx/db";
import { requireRole, getSession } from "../auth/guards";
import { loadPricingConfig, savePricingConfig } from "../config/pricing";
import { loadToolConfigs, saveToolConfigs } from "../config/tools";
import { getDefaultTenantId } from "../auth/repo";

export const configRoutes = new Hono();

// Billing tiers — display + soft usage caps. Payments are handled out-of-band
// (no card capture in-app); this surfaces plan, usage and upgrade contact.
const PLANS = {
  starter: { label: "Starter", priceInr: 0, limits: { leads: 100, jobs: 25 } },
  growth: { label: "Growth", priceInr: 4999, limits: { leads: 1000, jobs: 250 } },
  scale: { label: "Scale", priceInr: 14999, limits: { leads: 10000, jobs: 2500 } },
} as const;
type PlanKey = keyof typeof PLANS;

/** Current tenant pricing config (owner only — exposes margins/rates). */
configRoutes.get("/pricing", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  return c.json({ config: await loadPricingConfig(s.tenantId) });
});

/** Replace the tenant pricing config (validated + clamped server-side). */
configRoutes.put("/pricing", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);
  const saved = await savePricingConfig(s.tenantId, body);
  return c.json({ ok: true, config: saved });
});

/** Public tool gating for the default tenant — ToolHub renders/sorts/gates from this. */
configRoutes.get("/tools", async (c) => {
  const tenantId = await getDefaultTenantId();
  return c.json({ tools: await loadToolConfigs(tenantId) });
});

/** Replace the tenant tool gating (owner only). */
configRoutes.put("/tools", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const body = await c.req.json().catch(() => null);
  if (!Array.isArray(body)) return c.json({ error: "bad_body" }, 400);
  const saved = await saveToolConfigs(s.tenantId, body);
  return c.json({ ok: true, tools: saved });
});

// ───────────────────────── owner: business overview (KPIs) ──────────────────

/** Aggregate KPIs for the owner overview dashboard (tenant-scoped). */
configRoutes.get("/overview", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const db = getDb();
  const t = s.tenantId;

  const [leadRows, jobRows, contactsN, apptsN, inspN, quoteAgg, warrN] = await Promise.all([
    db.select({ k: leads.status, n: count() }).from(leads).where(eq(leads.tenantId, t)).groupBy(leads.status),
    db.select({ k: jobs.status, n: count() }).from(jobs).where(eq(jobs.tenantId, t)).groupBy(jobs.status),
    db.select({ n: count() }).from(contacts).where(eq(contacts.tenantId, t)),
    db.select({ n: count() }).from(appointments).where(eq(appointments.tenantId, t)),
    db.select({ n: count() }).from(inspections).where(eq(inspections.tenantId, t)),
    db.select({ n: count(), value: sum(quotes.total) }).from(quotes).where(and(eq(quotes.tenantId, t), eq(quotes.status, "accepted"))),
    db.select({ n: count() }).from(warranties).where(eq(warranties.tenantId, t)),
  ]);

  const toMap = (rows: { k: string | null; n: number }[]) =>
    Object.fromEntries(rows.map((r) => [r.k ?? "unknown", Number(r.n)]));
  const totalOf = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);
  const leadsByStatus = toMap(leadRows);
  const jobsByStatus = toMap(jobRows);

  return c.json({
    leads: { total: totalOf(leadsByStatus), byStatus: leadsByStatus },
    jobs: { total: totalOf(jobsByStatus), byStatus: jobsByStatus },
    contacts: Number(contactsN[0]?.n ?? 0),
    appointments: Number(apptsN[0]?.n ?? 0),
    inspections: Number(inspN[0]?.n ?? 0),
    quotes: { accepted: Number(quoteAgg[0]?.n ?? 0), acceptedValue: Number(quoteAgg[0]?.value ?? 0) },
    warranties: Number(warrN[0]?.n ?? 0),
  });
});

// ───────────────────────── owner: tenant (org) profile ──────────────────────

const tenantCols = {
  id: tenants.id, name: tenants.name, slug: tenants.slug,
  branding: tenants.branding, status: tenants.status, createdAt: tenants.createdAt,
};

/** Current organisation profile + member counts. */
configRoutes.get("/tenant", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const db = getDb();
  const r = await db.select(tenantCols).from(tenants).where(eq(tenants.id, s.tenantId)).limit(1);
  if (!r[0]) return c.json({ error: "not_found" }, 404);
  return c.json({ tenant: r[0] });
});

/** Update org name / branding (slug + status are immutable here). */
configRoutes.put("/tenant", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const body = await c.req.json<{ name?: string; branding?: Record<string, unknown> }>().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 191);
  if (body.branding && typeof body.branding === "object") patch.branding = body.branding;
  if (!Object.keys(patch).length) return c.json({ error: "nothing_to_update" }, 400);
  const db = getDb();
  await db.update(tenants).set(patch).where(eq(tenants.id, s.tenantId));
  const r = await db.select(tenantCols).from(tenants).where(eq(tenants.id, s.tenantId)).limit(1);
  return c.json({ ok: true, tenant: r[0] });
});

// ───────────────────────── owner: billing (plan + usage) ────────────────────

/** Plan, soft usage caps and current usage. Read-only; upgrades are out-of-band. */
configRoutes.get("/billing", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const db = getDb();
  const t = s.tenantId;

  const planRow = await db.select({ value: orgSettings.value }).from(orgSettings)
    .where(and(eq(orgSettings.tenantId, t), eq(orgSettings.key, "plan"))).limit(1);
  const raw = planRow[0]?.value;
  const planKey: PlanKey = (typeof raw === "string" && raw in PLANS ? raw
    : (raw as { plan?: string })?.plan && (raw as { plan?: string }).plan! in PLANS ? (raw as { plan: string }).plan
    : "starter") as PlanKey;
  const plan = PLANS[planKey];

  const [leadsN, jobsN] = await Promise.all([
    db.select({ n: count() }).from(leads).where(eq(leads.tenantId, t)),
    db.select({ n: count() }).from(jobs).where(eq(jobs.tenantId, t)),
  ]);

  return c.json({
    plan: { key: planKey, ...plan },
    usage: { leads: Number(leadsN[0]?.n ?? 0), jobs: Number(jobsN[0]?.n ?? 0) },
    plans: PLANS,
  });
});
