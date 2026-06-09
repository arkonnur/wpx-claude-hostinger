// Phase 7 — site-visit scheduling + crew assignment.
// Admin/owner schedule & assign appointments; field crew see + progress their own.
import { Hono } from "hono";
import { and, eq, desc, inArray, isNull } from "drizzle-orm";
import { getDb, appointments, leads, contacts, users, memberships } from "@wpx/db";
import { requireRole, getSession } from "../auth/guards";

export const appointmentRoutes = new Hono();

const APPT_STATUSES = [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;
type ApptStatus = (typeof APPT_STATUSES)[number];

// Statuses field crew may set themselves (no cancel — that's an office decision).
const CREW_STATUSES: ApptStatus[] = ["confirmed", "in_progress", "completed", "no_show"];

/** Shared select: appointment + its lead + contact + assignee name. */
const apptCols = {
  id: appointments.id,
  status: appointments.status,
  scheduledDate: appointments.scheduledDate,
  assignedTo: appointments.assignedTo,
  createdAt: appointments.createdAt,
  leadId: appointments.leadId,
  service: leads.service,
  severity: leads.severity,
  areaSqft: leads.areaSqft,
  leadStatus: leads.status,
  contactName: contacts.name,
  contactPhone: contacts.phone,
  contactAddress: contacts.address,
} as const;

function joined(db: ReturnType<typeof getDb>) {
  return db
    .select(apptCols)
    .from(appointments)
    .leftJoin(leads, eq(appointments.leadId, leads.id))
    .leftJoin(contacts, eq(leads.contactId, contacts.id));
}

// ───────────────────────── staff roster (for assignment) ────────────────────

/** Tenant field crew + admins — fills the "assign to" dropdown. */
appointmentRoutes.get("/staff", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const db = getDb();
  const rows = await db
    .select({ userId: memberships.userId, role: memberships.role, name: users.name, email: users.email })
    .from(memberships)
    .leftJoin(users, eq(memberships.userId, users.id))
    .where(and(eq(memberships.tenantId, s.tenantId), inArray(memberships.role, ["employee", "admin", "owner"])));
  // Collapse to one row per user (a user may hold multiple roles).
  const seen = new Map<string, { userId: string; name: string | null; email: string | null; roles: string[] }>();
  for (const r of rows) {
    const e = seen.get(r.userId) ?? { userId: r.userId, name: r.name ?? null, email: r.email ?? null, roles: [] };
    e.roles.push(r.role);
    seen.set(r.userId, e);
  }
  return c.json({ staff: [...seen.values()] });
});

// ───────────────────────── field crew: my assigned visits ───────────────────

/** Appointments assigned to the signed-in crew member (any authenticated role). */
appointmentRoutes.get("/mine", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.userId) return c.json({ appointments: [] });
  const db = getDb();
  const rows = await joined(db)
    .where(and(eq(appointments.tenantId, s.tenantId), eq(appointments.assignedTo, s.userId)))
    .orderBy(desc(appointments.scheduledDate))
    .limit(200);
  return c.json({ appointments: rows });
});

// ───────────────────────── admin/owner: full schedule ───────────────────────

/** All appointments for the tenant. Optional ?status= / ?assigned= filters. */
appointmentRoutes.get("/", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const statusF = c.req.query("status");
  const assignedF = c.req.query("assigned");
  const where = [eq(appointments.tenantId, s.tenantId)];
  if (statusF && (APPT_STATUSES as readonly string[]).includes(statusF)) {
    where.push(eq(appointments.status, statusF as ApptStatus));
  }
  if (assignedF === "unassigned") where.push(isNull(appointments.assignedTo));
  else if (assignedF) where.push(eq(appointments.assignedTo, assignedF));

  const db = getDb();
  const rows = await joined(db).where(and(...where)).orderBy(desc(appointments.scheduledDate)).limit(500);
  return c.json({ appointments: rows });
});

/** Schedule + assign an appointment (admin/owner). Sets date and/or crew. */
appointmentRoutes.patch("/:id/assign", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json<{ assignedTo?: string | null; scheduledDate?: string | null }>().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);

  const patch: Record<string, unknown> = {};
  if ("assignedTo" in body) {
    if (body.assignedTo) {
      // Validate the assignee actually belongs to this tenant as staff.
      const db0 = getDb();
      const m = await db0
        .select({ userId: memberships.userId })
        .from(memberships)
        .where(and(
          eq(memberships.tenantId, s.tenantId),
          eq(memberships.userId, body.assignedTo),
          inArray(memberships.role, ["employee", "admin", "owner"]),
        ))
        .limit(1);
      if (!m[0]) return c.json({ error: "bad_assignee" }, 400);
      patch.assignedTo = body.assignedTo;
    } else {
      patch.assignedTo = null;
    }
  }
  if ("scheduledDate" in body) {
    if (body.scheduledDate) {
      const d = new Date(body.scheduledDate);
      if (isNaN(d.getTime())) return c.json({ error: "bad_date" }, 400);
      patch.scheduledDate = d;
    } else {
      patch.scheduledDate = null;
    }
  }
  if (!Object.keys(patch).length) return c.json({ error: "nothing_to_update" }, 400);

  const db = getDb();
  const res = await db
    .update(appointments)
    .set(patch)
    .where(and(eq(appointments.id, id), eq(appointments.tenantId, s.tenantId)));
  const affected = (res as unknown as { affectedRows?: number }[])[0]?.affectedRows ?? 0;
  if (!affected) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true, id });
});

/** Progress an appointment's status. Admin/owner any; crew only their own + crew-allowed statuses. */
appointmentRoutes.patch("/:id/status", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId || !s.userId) return c.json({ error: "unauthenticated" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json<{ status?: string }>().catch(() => null);
  const status = body?.status;
  if (!status || !(APPT_STATUSES as readonly string[]).includes(status)) {
    return c.json({ error: "bad_status" }, 400);
  }

  const db = getDb();
  const isStaff = s.role === "admin" || s.role === "owner";
  if (!isStaff) {
    // Crew: must own the appointment and use a crew-allowed status.
    if (!CREW_STATUSES.includes(status as ApptStatus)) return c.json({ error: "forbidden" }, 403);
    const own = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, s.tenantId), eq(appointments.assignedTo, s.userId)))
      .limit(1);
    if (!own[0]) return c.json({ error: "forbidden" }, 403);
  }

  const res = await db
    .update(appointments)
    .set({ status: status as ApptStatus })
    .where(and(eq(appointments.id, id), eq(appointments.tenantId, s.tenantId)));
  const affected = (res as unknown as { affectedRows?: number }[])[0]?.affectedRows ?? 0;
  if (!affected) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true, id, status });
});
