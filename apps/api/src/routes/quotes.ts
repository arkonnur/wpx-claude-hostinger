// Phase 9 — quotes. The lifecycle gap between an inspection report and a job:
// generate a priced quote from the inspection, send it (which FREEZES the price
// snapshot — court-proof, never recalculated), customer accepts → becomes a job.
import { Hono } from "hono";
import { and, eq, desc } from "drizzle-orm";
import { randomUUID, randomBytes } from "node:crypto";
import { getDb, quotes, jobs, executionItems, inspections, leads, contacts } from "@wpx/db";
import { exactEstimate, type ServiceType, type Severity } from "@wpx/core";
import { requireRole, getSession } from "../auth/guards";
import { loadPricingConfig } from "../config/pricing";

export const quoteRoutes = new Hono();

const QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;
type QuoteStatus = (typeof QUOTE_STATUSES)[number];

const SERVICES: ServiceType[] = ["terrace", "roof", "bathroom", "wall", "basement", "tank", "pool", "facade", "balcony"];
const SEVERITIES: Severity[] = ["minor", "moderate", "severe", "critical"];
const VALID_DAYS = 30;

interface Finding { zone?: string; issue?: string; severity?: string; note?: string }
interface LineItem { description: string; areaSqft: number; ratePerSqft: number; amount: number }

function quoteNumber(): string {
  return `QUO-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/** Build line items + totals from a lead's service/area/severity using the live config. */
async function priceFromInspection(tenantId: string, params: {
  service: string | null; areaSqft: number | null; severity: string | null; findings: Finding[];
}) {
  const cfg = await loadPricingConfig(tenantId);
  const service = (SERVICES.includes(params.service as ServiceType) ? params.service : "terrace") as ServiceType;
  const severity = (SEVERITIES.includes(params.severity as Severity) ? params.severity : "moderate") as Severity;
  const area = Math.max(1, params.areaSqft ?? 0) || 100;

  const est = exactEstimate({ service, area, severity, tiers: ["medium"] }, cfg);
  const medium = est.tiers[0]!;
  const lineItems: LineItem[] = [
    {
      description: `${service} waterproofing — ${severity} severity (medium system)`,
      areaSqft: est.areaSqft,
      ratePerSqft: medium.ratePerSqft,
      amount: medium.subtotal,
    },
  ];
  return {
    lineItems,
    subtotal: medium.subtotal,
    gst: medium.gst,
    total: medium.total,
    snapshot: { estimate: est, configVersion: cfg.version, findings: params.findings, generatedFrom: "inspection" },
    configVersion: cfg.version,
  };
}

// ───────────────────────── generate from inspection ─────────────────────────

/** Create (or reuse) a draft quote from an inspection report. Admin/owner. */
quoteRoutes.post("/from-inspection/:inspectionId", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const inspectionId = c.req.param("inspectionId");
  const db = getDb();

  const ir = await db
    .select({ id: inspections.id, leadId: inspections.leadId, readings: inspections.readings, status: inspections.status })
    .from(inspections)
    .where(and(eq(inspections.id, inspectionId), eq(inspections.tenantId, s.tenantId)))
    .limit(1);
  const insp = ir[0];
  if (!insp) return c.json({ error: "not_found" }, 404);
  // Only price a submitted report — never an incomplete inspection.
  if (insp.status !== "report_ready") return c.json({ error: "inspection_not_ready" }, 409);

  const existing = await db.select().from(quotes)
    .where(and(eq(quotes.tenantId, s.tenantId), eq(quotes.inspectionId, inspectionId))).limit(1);
  if (existing[0]) return c.json({ quote: existing[0], existed: true });

  // Resolve lead context.
  let service: string | null = null, areaSqft: number | null = null, severity: string | null = null, contactId: string | null = null;
  if (insp.leadId) {
    const lr = await db.select({ service: leads.service, areaSqft: leads.areaSqft, severity: leads.severity, contactId: leads.contactId })
      .from(leads).where(and(eq(leads.id, insp.leadId), eq(leads.tenantId, s.tenantId))).limit(1);
    if (lr[0]) { service = lr[0].service; areaSqft = lr[0].areaSqft; severity = lr[0].severity; contactId = lr[0].contactId; }
  }
  const findings = (((insp.readings ?? {}) as { findings?: Finding[] }).findings ?? []);
  const priced = await priceFromInspection(s.tenantId, { service, areaSqft, severity, findings });

  const id = randomUUID();
  await db.insert(quotes).values({
    id, tenantId: s.tenantId, contactId, leadId: insp.leadId, inspectionId,
    number: quoteNumber(), lineItems: priced.lineItems,
    subtotal: String(priced.subtotal), gst: String(priced.gst), total: String(priced.total),
    status: "draft",
  });
  const rows = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return c.json({ quote: rows[0] });
});

// ───────────────────────── lists ────────────────────────────────────────────

/** Client's own quotes. */
quoteRoutes.get("/mine", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.contactId) return c.json({ quotes: [] });
  const db = getDb();
  const rows = await db.select().from(quotes)
    .where(and(eq(quotes.tenantId, s.tenantId), eq(quotes.contactId, s.contactId)))
    .orderBy(desc(quotes.createdAt)).limit(100);
  return c.json({ quotes: rows });
});

/** All quotes for the tenant. Admin/owner. */
quoteRoutes.get("/", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const db = getDb();
  const rows = await db
    .select({
      id: quotes.id, number: quotes.number, status: quotes.status, total: quotes.total,
      validUntil: quotes.validUntil, createdAt: quotes.createdAt,
      contactName: contacts.name,
    })
    .from(quotes).leftJoin(contacts, eq(quotes.contactId, contacts.id))
    .where(eq(quotes.tenantId, s.tenantId))
    .orderBy(desc(quotes.createdAt)).limit(500);
  return c.json({ quotes: rows });
});

/** Single quote. Admin/owner any; client only their own. */
quoteRoutes.get("/:id", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "unauthenticated" }, 401);
  const id = c.req.param("id");
  const db = getDb();
  const rows = await db.select().from(quotes).where(and(eq(quotes.id, id), eq(quotes.tenantId, s.tenantId))).limit(1);
  const q = rows[0];
  if (!q) return c.json({ error: "not_found" }, 404);
  const isStaff = s.role === "admin" || s.role === "owner";
  if (!isStaff && q.contactId !== s.contactId) return c.json({ error: "forbidden" }, 403);
  return c.json({ quote: q });
});

// ───────────────────────── status + freeze ──────────────────────────────────

// Freeze the price snapshot the first time a quote leaves draft — court-proof,
// never recalculated afterwards.
async function freezeIfNeeded(tenantId: string, q: typeof quotes.$inferSelect) {
  if (q.priceSnapshot) return; // already frozen
  const db = getDb();
  const cfg = await loadPricingConfig(tenantId);
  const validUntil = new Date(Date.now() + VALID_DAYS * 24 * 60 * 60 * 1000);
  const frozenAt = new Date();
  await db.update(quotes).set({
    priceSnapshot: { lineItems: q.lineItems, subtotal: q.subtotal, gst: q.gst, total: q.total, frozenAt: frozenAt.toISOString() },
    priceListVersion: cfg.version,
    formulaVersion: cfg.version,
    validUntil,
  }).where(eq(quotes.id, q.id));
}

/** Send / reject / expire a quote (admin/owner). Sending freezes the price. */
quoteRoutes.patch("/:id/status", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json<{ status?: string }>().catch(() => null);
  const status = body?.status;
  // "accepted" must go through POST /:id/accept (job + checklist seeding). This
  // endpoint only handles lifecycle transitions that don't spawn a job.
  const allowed = ["draft", "sent", "rejected", "expired"] as const;
  if (!status || !(allowed as readonly string[]).includes(status)) return c.json({ error: "bad_status" }, 400);

  const db = getDb();
  const rows = await db.select().from(quotes).where(and(eq(quotes.id, id), eq(quotes.tenantId, s.tenantId))).limit(1);
  const q = rows[0];
  if (!q) return c.json({ error: "not_found" }, 404);

  if (status !== "draft") await freezeIfNeeded(s.tenantId, q);
  await db.update(quotes).set({ status: status as QuoteStatus }).where(eq(quotes.id, id));
  return c.json({ ok: true, id, status });
});

// ───────────────────────── accept → job ─────────────────────────────────────

/** Accept a quote (client own, or admin/owner). Freezes price, spawns a job. */
quoteRoutes.post("/:id/accept", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "unauthenticated" }, 401);
  const id = c.req.param("id");
  const db = getDb();
  const rows = await db.select().from(quotes).where(and(eq(quotes.id, id), eq(quotes.tenantId, s.tenantId))).limit(1);
  const q = rows[0];
  if (!q) return c.json({ error: "not_found" }, 404);

  const isStaff = s.role === "admin" || s.role === "owner";
  if (!isStaff && q.contactId !== s.contactId) return c.json({ error: "forbidden" }, 403);
  // Clients may only accept a live (sent) or already-accepted quote — never a
  // draft/rejected/expired one.
  if (!isStaff && q.status !== "sent" && q.status !== "accepted") {
    return c.json({ error: "invalid_status" }, 409);
  }
  if (q.validUntil && new Date(q.validUntil).getTime() < Date.now() && q.status !== "accepted") {
    return c.json({ error: "expired" }, 409);
  }

  await freezeIfNeeded(s.tenantId, q);

  // Reuse an existing job for this quote (idempotent).
  const existingJob = await db.select({ id: jobs.id }).from(jobs)
    .where(and(eq(jobs.tenantId, s.tenantId), eq(jobs.quoteId, id))).limit(1);
  if (existingJob[0]) {
    await db.update(quotes).set({ status: "accepted" }).where(eq(quotes.id, id));
    return c.json({ ok: true, quoteId: id, jobId: existingJob[0].id, existed: true });
  }

  // Seed execution checklist from the inspection findings.
  let findings: Finding[] = [];
  let inspectorId: string | null = null;
  if (q.inspectionId) {
    const ir = await db.select({ readings: inspections.readings, inspectorId: inspections.inspectorId })
      .from(inspections).where(and(eq(inspections.id, q.inspectionId), eq(inspections.tenantId, s.tenantId))).limit(1);
    if (ir[0]) { findings = (((ir[0].readings ?? {}) as { findings?: Finding[] }).findings ?? []); inspectorId = ir[0].inspectorId; }
  }

  const jobId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(jobs).values({
      id: jobId, tenantId: s.tenantId!, inspectionId: q.inspectionId, quoteId: id,
      contactId: q.contactId, assignedTo: inspectorId, status: "scheduled",
    });
    const items = findings.length
      ? findings.map((f) => ({
          id: randomUUID(), tenantId: s.tenantId!, jobId,
          zone: (f.zone || "General").slice(0, 80), label: (f.issue || "Waterproofing treatment").slice(0, 191),
          status: "pending" as const,
        }))
      : [{ id: randomUUID(), tenantId: s.tenantId!, jobId, zone: "General", label: "Waterproofing treatment", status: "pending" as const }];
    await tx.insert(executionItems).values(items);
    await tx.update(quotes).set({ status: "accepted" }).where(eq(quotes.id, id));
  });
  return c.json({ ok: true, quoteId: id, jobId });
});
