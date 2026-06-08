// Lead capture — public endpoint behind anti-spam. Powers the booking form,
// "book free site visit" CTA, and any tool that hands off to a human.
import { Hono } from "hono";
import { and, eq, desc, gt } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, contacts, leads, appointments, clientEvents } from "@wpx/db";
import { normalizePhone, hashPhone } from "../auth/crypto";
import { getDefaultTenantId, activeBan } from "../auth/repo";
import { clientIp, deviceId, requireRole, getSession } from "../auth/guards";

export const leadRoutes = new Hono();

const LEAD_STATUSES = [
  "new",
  "contacted",
  "site_visit_scheduled",
  "quoted",
  "converted",
  "lost",
] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

type ScoreTier = "hot" | "warm" | "cold";

// Field caps (defense against oversized-input DoS / stored bloat).
const MAX = { name: 120, email: 191, service: 40, severity: 20, source: 80, notes: 2000 };
const clip = (v: string | undefined, n: number) => (v ? v.slice(0, n) : undefined);

// Lightweight in-memory per-IP rate limit (best-effort; resets on restart).
// Durable ban/quota live in the DB; this just blunts bursts on the public form.
const ipHits = new Map<string, number[]>();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 5;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  ipHits.set(ip, arr);
  if (ipHits.size > 5000) ipHits.clear(); // crude memory cap
  return arr.length > RL_MAX;
}

/** Lead score (Phase 6). Intent (severity/area) + channel + engagement + trust. */
function scoreLead(input: {
  severity?: string;
  areaSqft?: number;
  source?: string;
  hasNotes: boolean;
  verified?: boolean;
  engagement?: number; // recent tracked events for this contact
}): { score: number; tier: ScoreTier } {
  let s = 40;
  const sev = (input.severity ?? "").toLowerCase();
  if (sev === "critical") s += 30;
  else if (sev === "severe") s += 20;
  else if (sev === "moderate") s += 10;
  const a = input.areaSqft ?? 0;
  if (a >= 2000) s += 15;
  else if (a >= 800) s += 8;
  if ((input.source ?? "").includes("book") || (input.source ?? "").includes("inspection")) s += 15;
  if (input.hasNotes) s += 5;
  if (input.verified) s += 10; // proven phone = real, reachable
  if (input.engagement) s += Math.min(15, input.engagement * 3); // tool usage = intent
  s = Math.min(100, s);
  const tier: ScoreTier = s >= 70 ? "hot" : s >= 50 ? "warm" : "cold";
  return { score: s, tier };
}

/** Clamp a free-form area to a sane sqft range; <=0 / NaN → undefined. */
function cleanArea(raw: number | string | undefined): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(n, 1_000_000);
}

interface LeadBody {
  name?: string;
  phone: string;
  email?: string;
  area?: number | string;
  service?: string;
  severity?: string;
  notes?: string;
  preferredDate?: string;
  source?: string;
  honeypot?: string;
  utm?: Record<string, string>;
}

leadRoutes.post("/", async (c) => {
  const body = await c.req.json<LeadBody>().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);

  // Honeypot: real users never fill this hidden field (respond ok to not tip off bots).
  if (body.honeypot) return c.json({ ok: true });

  const ip = clientIp(c);
  const dev = deviceId(c);

  // Durable ban + burst rate limit before any DB writes.
  if (await activeBan(ip, dev)) return c.json({ error: "blocked" }, 403);
  if (rateLimited(ip)) return c.json({ error: "rate_limited" }, 429);

  const e164 = normalizePhone(body.phone ?? "");
  if (!e164) return c.json({ error: "bad_phone" }, 400);
  const name = clip(body.name?.trim(), MAX.name);
  if (!name || name.length < 2) return c.json({ error: "bad_name" }, 400);
  const email = clip(body.email?.trim(), MAX.email);
  const notes = clip(body.notes?.trim(), MAX.notes);

  const db = getDb();
  const tenantId = await getDefaultTenantId();
  const phoneHash = hashPhone(e164);
  const areaSqft = cleanArea(body.area);

  // Find-or-create contact. NEVER overwrite identity of a verified / account-holding
  // contact from this unauthenticated endpoint; only fill blank fields otherwise.
  let contactId: string;
  let verified = false;
  const existing = await db
    .select({ id: contacts.id, name: contacts.name, email: contacts.email, verifiedAt: contacts.verifiedAt, hasAccount: contacts.hasAccount })
    .from(contacts)
    .where(and(eq(contacts.tenantId, tenantId), eq(contacts.phoneHash, phoneHash)))
    .limit(1);

  if (existing[0]) {
    verified = !!existing[0].verifiedAt;
    contactId = existing[0].id;
    const locked = !!existing[0].verifiedAt || existing[0].hasAccount;
    if (!locked) {
      const patch: Record<string, string> = {};
      if (!existing[0].name && name) patch.name = name;
      if (!existing[0].email && email) patch.email = email;
      if (Object.keys(patch).length) await db.update(contacts).set(patch).where(eq(contacts.id, contactId));
    }
    // Dedup: ignore a repeat lead from the same contact within 2 minutes (double-submit / spam).
    const cutoff = new Date(Date.now() - 2 * 60_000);
    const recent = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.tenantId, tenantId), eq(leads.contactId, contactId), gt(leads.createdAt, cutoff)))
      .limit(1);
    if (recent[0]) return c.json({ ok: true, leadId: recent[0].id, deduped: true });
  } else {
    contactId = randomUUID();
    await db.insert(contacts).values({ id: contactId, tenantId, name, phone: e164, phoneHash, email });
  }

  // Engagement: count this contact's tracked events in the last 7 days.
  const engCutoff = new Date(Date.now() - 7 * 24 * 60 * 60_000);
  const engRows = await db
    .select({ id: clientEvents.id })
    .from(clientEvents)
    .where(and(eq(clientEvents.tenantId, tenantId), eq(clientEvents.contactId, contactId), gt(clientEvents.createdAt, engCutoff)))
    .limit(20);

  const { score, tier } = scoreLead({
    severity: body.severity,
    areaSqft,
    source: body.source,
    hasNotes: !!notes,
    verified,
    engagement: engRows.length,
  });

  const hasAppt = (() => {
    if (!body.preferredDate) return false;
    const d = new Date(body.preferredDate);
    return !isNaN(d.getTime());
  })();

  const leadId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(leads).values({
      id: leadId,
      tenantId,
      contactId,
      service: clip(body.service, MAX.service),
      severity: clip(body.severity, MAX.severity),
      areaSqft,
      source: clip(body.source, MAX.source) ?? "website",
      // utm doubles as a meta catch-all until dedicated columns exist (notes/locality).
      utm: notes ? { notes } : null,
      score,
      scoreTier: tier,
      status: hasAppt ? "site_visit_scheduled" : "new",
    });
    if (hasAppt) {
      await tx.insert(appointments).values({
        id: randomUUID(),
        tenantId,
        leadId,
        scheduledDate: new Date(body.preferredDate!),
        status: "scheduled",
      });
    }
  });

  return c.json({ ok: true, leadId, score, tier });
});

// ───────────────────────── client: my own requests + activity ───────────────

/** The signed-in user's own leads + recent activity (any role). */
leadRoutes.get("/mine", requireRole(), async (c) => {
  const s = await getSession(c);
  if (!s?.contactId || !s.tenantId) return c.json({ leads: [], events: [] });
  const db = getDb();
  const [mine, events] = await Promise.all([
    db.select({
      id: leads.id, service: leads.service, severity: leads.severity, areaSqft: leads.areaSqft,
      status: leads.status, source: leads.source, createdAt: leads.createdAt, utm: leads.utm,
    }).from(leads).where(and(eq(leads.tenantId, s.tenantId), eq(leads.contactId, s.contactId)))
      .orderBy(desc(leads.createdAt)).limit(50),
    db.select({
      id: clientEvents.id, type: clientEvents.type, createdAt: clientEvents.createdAt,
    }).from(clientEvents).where(and(eq(clientEvents.tenantId, s.tenantId), eq(clientEvents.contactId, s.contactId)))
      .orderBy(desc(clientEvents.createdAt)).limit(30),
  ]);
  return c.json({ leads: mine, events });
});

// ───────────────────────── admin/owner: list + manage leads ─────────────────

/** List leads for the session's tenant, newest first. Optional ?status= / ?tier= filters. */
leadRoutes.get("/", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const tenantId = s.tenantId;
  const statusF = c.req.query("status");
  const tierF = c.req.query("tier");

  const db = getDb();
  const where = [eq(leads.tenantId, tenantId)];
  if (statusF && (LEAD_STATUSES as readonly string[]).includes(statusF)) {
    where.push(eq(leads.status, statusF as LeadStatus));
  }
  if (tierF && ["hot", "warm", "cold"].includes(tierF)) {
    where.push(eq(leads.scoreTier, tierF as ScoreTier));
  }

  const rows = await db
    .select({
      id: leads.id,
      service: leads.service,
      severity: leads.severity,
      areaSqft: leads.areaSqft,
      status: leads.status,
      source: leads.source,
      score: leads.score,
      scoreTier: leads.scoreTier,
      utm: leads.utm,
      createdAt: leads.createdAt,
      name: contacts.name,
      phone: contacts.phone,
      email: contacts.email,
      contactId: contacts.id,
    })
    .from(leads)
    .leftJoin(contacts, eq(leads.contactId, contacts.id))
    .where(and(...where))
    .orderBy(desc(leads.createdAt))
    .limit(500);

  return c.json({ leads: rows });
});

/** Contact timeline for a lead: the contact, all their leads, and recent events. */
leadRoutes.get("/:id/timeline", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const tenantId = s.tenantId;
  const id = c.req.param("id");
  const db = getDb();

  const leadRow = await db
    .select({ contactId: leads.contactId })
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
    .limit(1);
  const contactId = leadRow[0]?.contactId;
  if (!contactId) return c.json({ error: "not_found" }, 404);

  const [contact, leadHistory, events] = await Promise.all([
    db.select({
      id: contacts.id, name: contacts.name, phone: contacts.phone, email: contacts.email,
      address: contacts.address, verifiedAt: contacts.verifiedAt, hasAccount: contacts.hasAccount,
      createdAt: contacts.createdAt,
    }).from(contacts).where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId))).limit(1),
    db.select({
      id: leads.id, service: leads.service, severity: leads.severity, areaSqft: leads.areaSqft,
      status: leads.status, source: leads.source, score: leads.score, scoreTier: leads.scoreTier,
      utm: leads.utm, createdAt: leads.createdAt,
    }).from(leads).where(and(eq(leads.tenantId, tenantId), eq(leads.contactId, contactId)))
      .orderBy(desc(leads.createdAt)).limit(50),
    db.select({
      id: clientEvents.id, type: clientEvents.type, payload: clientEvents.payload, createdAt: clientEvents.createdAt,
    }).from(clientEvents).where(and(eq(clientEvents.tenantId, tenantId), eq(clientEvents.contactId, contactId)))
      .orderBy(desc(clientEvents.createdAt)).limit(100),
  ]);

  if (!contact[0]) return c.json({ error: "not_found" }, 404);
  return c.json({ contact: contact[0], leads: leadHistory, events });
});

/** Update a lead's pipeline status. */
leadRoutes.patch("/:id", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json<{ status?: string }>().catch(() => null);
  const status = body?.status;
  if (!status || !(LEAD_STATUSES as readonly string[]).includes(status)) {
    return c.json({ error: "bad_status" }, 400);
  }

  const db = getDb();
  const res = await db
    .update(leads)
    .set({ status: status as LeadStatus })
    .where(and(eq(leads.id, id), eq(leads.tenantId, s.tenantId)));
  const affected = (res as unknown as { affectedRows?: number }[])[0]?.affectedRows ?? 0;
  if (!affected) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true, id, status });
});
