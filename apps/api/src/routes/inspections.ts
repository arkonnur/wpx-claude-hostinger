// Phase 7 — on-site inspection capture. Field crew record findings during a
// visit; the report feeds the quote. One inspection per appointment (get-or-create).
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, inspections, appointments, leads, contacts } from "@wpx/db";
import { requireRole, getSession } from "../auth/guards";

export const inspectionRoutes = new Hono();

const INSPECTION_STATUSES = ["draft", "in_progress", "completed", "report_ready"] as const;
type InspStatus = (typeof INSPECTION_STATUSES)[number];

// A single recorded observation. Free-form but capped to stop stored bloat.
interface Finding { zone?: string; issue?: string; severity?: string; note?: string }
const MAX_FINDINGS = 40;
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);
function cleanFindings(raw: unknown): Finding[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_FINDINGS).map((f) => ({
    zone: clip(f?.zone, 80),
    issue: clip(f?.issue, 191),
    severity: clip(f?.severity, 20),
    note: clip(f?.note, 500),
  })).filter((f) => f.zone || f.issue || f.note);
}

// ───────────────────────── get-or-create for an appointment ─────────────────

/** Open (or start) the inspection for an appointment. Crew must own it. */
inspectionRoutes.post("/for-appointment/:apptId", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.userId) return c.json({ error: "unauthenticated" }, 401);
  const apptId = c.req.param("apptId");
  const db = getDb();

  const apptRows = await db
    .select({ id: appointments.id, leadId: appointments.leadId, assignedTo: appointments.assignedTo })
    .from(appointments)
    .where(and(eq(appointments.id, apptId), eq(appointments.tenantId, s.tenantId)))
    .limit(1);
  const appt = apptRows[0];
  if (!appt) return c.json({ error: "not_found" }, 404);

  const isStaff = s.role === "admin" || s.role === "owner";
  if (!isStaff && appt.assignedTo !== s.userId) return c.json({ error: "forbidden" }, 403);

  const existing = await db
    .select()
    .from(inspections)
    .where(and(eq(inspections.tenantId, s.tenantId), eq(inspections.appointmentId, apptId)))
    .limit(1);
  if (existing[0]) return c.json({ inspection: existing[0] });

  const id = randomUUID();
  await db.insert(inspections).values({
    id,
    tenantId: s.tenantId,
    leadId: appt.leadId,
    appointmentId: apptId,
    inspectorId: s.userId,
    status: "in_progress",
  });
  const rows = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  return c.json({ inspection: rows[0] });
});

// ───────────────────────── fetch one (with context) ─────────────────────────

/** Fetch an inspection plus its lead + contact (for the report header). */
inspectionRoutes.get("/:id", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.userId) return c.json({ error: "unauthenticated" }, 401);
  const id = c.req.param("id");
  const db = getDb();

  const rows = await db
    .select({
      insp: inspections,
      service: leads.service,
      severity: leads.severity,
      areaSqft: leads.areaSqft,
      contactName: contacts.name,
      contactPhone: contacts.phone,
      contactAddress: contacts.address,
      apptAssignedTo: appointments.assignedTo,
    })
    .from(inspections)
    .leftJoin(leads, eq(inspections.leadId, leads.id))
    .leftJoin(contacts, eq(leads.contactId, contacts.id))
    .leftJoin(appointments, eq(inspections.appointmentId, appointments.id))
    .where(and(eq(inspections.id, id), eq(inspections.tenantId, s.tenantId)))
    .limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: "not_found" }, 404);

  const isStaff = s.role === "admin" || s.role === "owner";
  if (!isStaff && row.insp.inspectorId !== s.userId && row.apptAssignedTo !== s.userId) {
    return c.json({ error: "forbidden" }, 403);
  }
  return c.json({
    inspection: row.insp,
    lead: { service: row.service, severity: row.severity, areaSqft: row.areaSqft },
    contact: { name: row.contactName, phone: row.contactPhone, address: row.contactAddress },
  });
});

// ───────────────────────── save findings / status ───────────────────────────

/** Save findings + summary; optionally mark report_ready. Crew own-only. */
inspectionRoutes.patch("/:id", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.userId) return c.json({ error: "unauthenticated" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json<{ findings?: unknown; summary?: string; recommendation?: string; status?: string }>().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);

  const db = getDb();
  const rows = await db
    .select({ inspectorId: inspections.inspectorId, readings: inspections.readings, appointmentId: inspections.appointmentId })
    .from(inspections)
    .where(and(eq(inspections.id, id), eq(inspections.tenantId, s.tenantId)))
    .limit(1);
  const insp = rows[0];
  if (!insp) return c.json({ error: "not_found" }, 404);

  const isStaff = s.role === "admin" || s.role === "owner";
  if (!isStaff && insp.inspectorId !== s.userId) return c.json({ error: "forbidden" }, 403);

  // readings json holds the full report payload (findings + narrative).
  const prev = (insp.readings ?? {}) as Record<string, unknown>;
  const readings: Record<string, unknown> = { ...prev };
  if (body.findings !== undefined) readings.findings = cleanFindings(body.findings);
  if (body.summary !== undefined) readings.summary = clip(body.summary, 2000) ?? "";
  if (body.recommendation !== undefined) readings.recommendation = clip(body.recommendation, 2000) ?? "";

  const patch: Record<string, unknown> = { readings };
  if (body.status && (INSPECTION_STATUSES as readonly string[]).includes(body.status)) {
    patch.status = body.status as InspStatus;
  }

  await db.update(inspections).set(patch).where(and(eq(inspections.id, id), eq(inspections.tenantId, s.tenantId)));
  const fresh = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  return c.json({ ok: true, inspection: fresh[0] });
});
