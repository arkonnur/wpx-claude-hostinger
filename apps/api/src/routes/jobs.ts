// Phase 7 — execution. A report_ready inspection becomes a job; the job carries
// an execution checklist (seeded from inspection findings) that crew tick off
// on site with material/batch evidence, then admin QA-signs and issues warranty.
import { Hono } from "hono";
import { and, eq, desc } from "drizzle-orm";
import { randomUUID, randomBytes } from "node:crypto";
import { getDb, jobs, executionItems, inspections, leads, contacts, warranties } from "@wpx/db";
import { requireRole, getSession } from "../auth/guards";

export const jobRoutes = new Hono();

const JOB_STATUSES = ["scheduled", "mobilising", "in_progress", "qa", "handover", "warranty_issued", "cancelled"] as const;
type JobStatus = (typeof JOB_STATUSES)[number];
const ITEM_STATUSES = ["pending", "done", "na"] as const;
type ItemStatus = (typeof ITEM_STATUSES)[number];

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);

interface Finding { zone?: string; issue?: string; severity?: string; note?: string }

// ───────────────────────── create job from an inspection ────────────────────

/** Convert a report_ready inspection into a job; seed checklist from findings. */
jobRoutes.post("/from-inspection/:inspectionId", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const inspectionId = c.req.param("inspectionId");
  const db = getDb();

  const rows = await db
    .select({ id: inspections.id, leadId: inspections.leadId, readings: inspections.readings, inspectorId: inspections.inspectorId })
    .from(inspections)
    .where(and(eq(inspections.id, inspectionId), eq(inspections.tenantId, s.tenantId)))
    .limit(1);
  const insp = rows[0];
  if (!insp) return c.json({ error: "not_found" }, 404);

  // Reuse an existing job for this inspection (idempotent).
  const existing = await db.select({ id: jobs.id }).from(jobs)
    .where(and(eq(jobs.tenantId, s.tenantId), eq(jobs.inspectionId, inspectionId))).limit(1);
  if (existing[0]) return c.json({ jobId: existing[0].id, existed: true });

  // Resolve the contact via the lead.
  let contactId: string | null = null;
  if (insp.leadId) {
    const lr = await db.select({ contactId: leads.contactId }).from(leads)
      .where(and(eq(leads.id, insp.leadId), eq(leads.tenantId, s.tenantId))).limit(1);
    contactId = lr[0]?.contactId ?? null;
  }

  const findings = (((insp.readings ?? {}) as { findings?: Finding[] }).findings ?? []);
  const jobId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(jobs).values({
      id: jobId, tenantId: s.tenantId!, inspectionId, contactId,
      assignedTo: insp.inspectorId ?? null, status: "scheduled",
    });
    // One checklist item per finding; fall back to a single generic item.
    const items = findings.length
      ? findings.map((f) => ({
          id: randomUUID(), tenantId: s.tenantId!, jobId,
          zone: clip(f.zone, 80) || "General",
          label: clip(f.issue, 191) || "Waterproofing treatment",
          status: "pending" as const,
        }))
      : [{ id: randomUUID(), tenantId: s.tenantId!, jobId, zone: "General", label: "Waterproofing treatment", status: "pending" as const }];
    await tx.insert(executionItems).values(items);
  });
  // Mark inspection consumed.
  await db.update(inspections).set({ status: "completed" }).where(eq(inspections.id, inspectionId));
  return c.json({ jobId });
});

// ───────────────────────── crew: my jobs ────────────────────────────────────

jobRoutes.get("/mine", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.userId) return c.json({ jobs: [] });
  const db = getDb();
  const rows = await db
    .select({
      id: jobs.id, status: jobs.status, createdAt: jobs.createdAt,
      contactName: contacts.name, contactAddress: contacts.address, contactPhone: contacts.phone,
    })
    .from(jobs)
    .leftJoin(contacts, eq(jobs.contactId, contacts.id))
    .where(and(eq(jobs.tenantId, s.tenantId), eq(jobs.assignedTo, s.userId)))
    .orderBy(desc(jobs.createdAt)).limit(200);
  return c.json({ jobs: rows });
});

// ───────────────────────── admin: list jobs ─────────────────────────────────

jobRoutes.get("/", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const db = getDb();
  const rows = await db
    .select({
      id: jobs.id, status: jobs.status, assignedTo: jobs.assignedTo, createdAt: jobs.createdAt,
      contactName: contacts.name, contactAddress: contacts.address,
    })
    .from(jobs)
    .leftJoin(contacts, eq(jobs.contactId, contacts.id))
    .where(eq(jobs.tenantId, s.tenantId))
    .orderBy(desc(jobs.createdAt)).limit(500);
  return c.json({ jobs: rows });
});

// ───────────────────────── job detail + checklist ───────────────────────────

jobRoutes.get("/:id", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.userId) return c.json({ error: "unauthenticated" }, 401);
  const id = c.req.param("id");
  const db = getDb();
  const jr = await db
    .select({
      id: jobs.id, status: jobs.status, assignedTo: jobs.assignedTo,
      contactName: contacts.name, contactAddress: contacts.address, contactPhone: contacts.phone,
    })
    .from(jobs).leftJoin(contacts, eq(jobs.contactId, contacts.id))
    .where(and(eq(jobs.id, id), eq(jobs.tenantId, s.tenantId))).limit(1);
  const job = jr[0];
  if (!job) return c.json({ error: "not_found" }, 404);
  const isStaff = s.role === "admin" || s.role === "owner";
  if (!isStaff && job.assignedTo !== s.userId) return c.json({ error: "forbidden" }, 403);

  const items = await db.select().from(executionItems)
    .where(and(eq(executionItems.tenantId, s.tenantId), eq(executionItems.jobId, id)));
  const wr = await db.select({ cardNo: warranties.cardNo, qrToken: warranties.qrToken, years: warranties.years, brand: warranties.brand, expiryDate: warranties.expiryDate })
    .from(warranties).where(and(eq(warranties.tenantId, s.tenantId), eq(warranties.jobId, id))).limit(1);
  return c.json({ job, items, warranty: wr[0] ?? null });
});

/** Update job status (admin/owner). */
jobRoutes.patch("/:id", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json<{ status?: string; assignedTo?: string | null }>().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);
  const patch: Record<string, unknown> = {};
  if (body.status && (JOB_STATUSES as readonly string[]).includes(body.status)) patch.status = body.status as JobStatus;
  if ("assignedTo" in body) patch.assignedTo = body.assignedTo || null;
  if (!Object.keys(patch).length) return c.json({ error: "nothing_to_update" }, 400);
  const db = getDb();
  const res = await db.update(jobs).set(patch).where(and(eq(jobs.id, id), eq(jobs.tenantId, s.tenantId)));
  const affected = (res as unknown as { affectedRows?: number }[])[0]?.affectedRows ?? 0;
  if (!affected) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true, id });
});

// ───────────────────────── execution items ──────────────────────────────────

// Crew may set execution evidence on their own job's items; admin/owner any.
async function canTouchItem(s: { tenantId: string; userId: string; role: string }, itemId: string) {
  const db = getDb();
  const rows = await db
    .select({ jobId: executionItems.jobId, assignedTo: jobs.assignedTo })
    .from(executionItems)
    .leftJoin(jobs, eq(executionItems.jobId, jobs.id))
    .where(and(eq(executionItems.id, itemId), eq(executionItems.tenantId, s.tenantId)))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false as const, code: 404 as const };
  const isStaff = s.role === "admin" || s.role === "owner";
  if (!isStaff && row.assignedTo !== s.userId) return { ok: false as const, code: 403 as const };
  return { ok: true as const, jobId: row.jobId };
}

/** Crew records execution: status + material/batch/quantity/coverage/crew/weather. */
jobRoutes.patch("/items/:itemId", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.userId) return c.json({ error: "unauthenticated" }, 401);
  const itemId = c.req.param("itemId");
  const chk = await canTouchItem({ tenantId: s.tenantId, userId: s.userId, role: s.role }, itemId);
  if (!chk.ok) return c.json({ error: chk.code === 404 ? "not_found" : "forbidden" }, chk.code);

  const body = await c.req.json<Record<string, unknown>>().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);
  const patch: Record<string, unknown> = {};
  if (typeof body.status === "string" && (ITEM_STATUSES as readonly string[]).includes(body.status)) patch.status = body.status as ItemStatus;
  for (const k of ["material", "batchNo", "quantity", "coverage", "crew", "weather"] as const) {
    if (k in body) patch[k] = clip(body[k], 191) ?? null;
  }
  if (Array.isArray(body.photos)) patch.photos = body.photos.slice(0, 12).map((u) => clip(u, 512)).filter(Boolean);
  if (!Object.keys(patch).length) return c.json({ error: "nothing_to_update" }, 400);
  const db = getDb();
  await db.update(executionItems).set(patch).where(and(eq(executionItems.id, itemId), eq(executionItems.tenantId, s.tenantId)));
  return c.json({ ok: true, itemId });
});

/** Admin/owner QA sign-off on an execution item. */
jobRoutes.patch("/items/:itemId/qa", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.userId) return c.json({ error: "unauthenticated" }, 401);
  const itemId = c.req.param("itemId");
  const body = await c.req.json<{ qaVerified?: boolean }>().catch(() => ({} as { qaVerified?: boolean }));
  const db = getDb();
  const res = await db.update(executionItems)
    .set({ qaVerified: body?.qaVerified !== false, qaBy: s.userId })
    .where(and(eq(executionItems.id, itemId), eq(executionItems.tenantId, s.tenantId)));
  const affected = (res as unknown as { affectedRows?: number }[])[0]?.affectedRows ?? 0;
  if (!affected) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true, itemId });
});

// ───────────────────────── warranty issuance ────────────────────────────────

function cardNumber(): string {
  // WPX-XXXX-XXXX (Crockford-ish, no ambiguous chars). Year omitted (no Date in scripts dep here is fine at runtime).
  const a = randomBytes(4).toString("hex").toUpperCase().slice(0, 4);
  const b = randomBytes(4).toString("hex").toUpperCase().slice(0, 4);
  return `WPX-${a}-${b}`;
}

/** Issue a warranty card for a finished job (admin/owner). Idempotent per job. */
jobRoutes.post("/:id/warranty", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json<{ years?: number; brand?: string }>().catch(() => ({} as { years?: number; brand?: string }));
  const db = getDb();

  const jr = await db.select({ id: jobs.id, contactId: jobs.contactId, status: jobs.status })
    .from(jobs).where(and(eq(jobs.id, id), eq(jobs.tenantId, s.tenantId))).limit(1);
  const job = jr[0];
  if (!job) return c.json({ error: "not_found" }, 404);

  const existing = await db.select().from(warranties)
    .where(and(eq(warranties.tenantId, s.tenantId), eq(warranties.jobId, id))).limit(1);
  if (existing[0]) return c.json({ warranty: existing[0], existed: true });

  const years = Math.min(20, Math.max(1, Math.round(Number(body.years) || 5)));
  const issue = new Date();
  const expiry = new Date(issue.getTime());
  expiry.setFullYear(expiry.getFullYear() + years);
  const wid = randomUUID();
  const warranty = {
    id: wid, tenantId: s.tenantId, jobId: id, contactId: job.contactId,
    cardNo: cardNumber(), qrToken: randomBytes(24).toString("hex"),
    brand: clip(body.brand, 120) ?? null, years,
    issueDate: issue, expiryDate: expiry,
    snapshot: { jobId: id, years },
  };
  await db.transaction(async (tx) => {
    await tx.insert(warranties).values(warranty);
    await tx.update(jobs).set({ status: "warranty_issued" }).where(eq(jobs.id, id));
  });
  return c.json({ warranty });
});
