// Lead capture — public endpoint behind light anti-spam. Powers the booking form,
// "book free site visit" CTA, and any tool that hands off to a human.
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, contacts, leads, appointments } from "@wpx/db";
import { normalizePhone, hashPhone } from "../auth/crypto";
import { getDefaultTenantId } from "../auth/repo";
import { clientIp, deviceId } from "../auth/guards";

export const leadRoutes = new Hono();

type ScoreTier = "hot" | "warm" | "cold";

/** Lightweight lead score (Phase 6 baseline; full model later). */
function scoreLead(input: {
  severity?: string;
  areaSqft?: number;
  source?: string;
  hasNotes: boolean;
}): { score: number; tier: ScoreTier } {
  let s = 40;
  const sev = (input.severity ?? "").toLowerCase();
  if (sev === "critical") s += 30;
  else if (sev === "severe") s += 20;
  else if (sev === "moderate") s += 10;
  const a = input.areaSqft ?? 0;
  if (a >= 2000) s += 15;
  else if (a >= 800) s += 8;
  // Booking / site-visit intent is a strong signal.
  if ((input.source ?? "").includes("book") || (input.source ?? "").includes("inspection")) s += 15;
  if (input.hasNotes) s += 5;
  s = Math.min(100, s);
  const tier: ScoreTier = s >= 70 ? "hot" : s >= 50 ? "warm" : "cold";
  return { score: s, tier };
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

  // Honeypot: real users never fill this hidden field.
  if (body.honeypot) return c.json({ ok: true });

  const e164 = normalizePhone(body.phone ?? "");
  if (!e164) return c.json({ error: "bad_phone" }, 400);
  if (!body.name || body.name.trim().length < 2) return c.json({ error: "bad_name" }, 400);

  const db = getDb();
  const tenantId = await getDefaultTenantId();
  const phoneHash = hashPhone(e164);
  const areaSqft = body.area ? Math.round(Number(body.area)) || undefined : undefined;

  // Find or create the contact (do NOT mark verified — this is an unauthenticated lead).
  let contactId: string;
  const existing = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.tenantId, tenantId), eq(contacts.phoneHash, phoneHash)))
    .limit(1);
  if (existing[0]) {
    contactId = existing[0].id;
    if (body.name || body.email) {
      await db
        .update(contacts)
        .set({ name: body.name, email: body.email })
        .where(eq(contacts.id, contactId));
    }
  } else {
    contactId = randomUUID();
    await db.insert(contacts).values({
      id: contactId,
      tenantId,
      name: body.name,
      phone: e164,
      phoneHash,
      email: body.email,
    });
  }

  const { score, tier } = scoreLead({
    severity: body.severity,
    areaSqft,
    source: body.source,
    hasNotes: !!body.notes,
  });

  const leadId = randomUUID();
  await db.insert(leads).values({
    id: leadId,
    tenantId,
    contactId,
    service: body.service?.slice(0, 40),
    severity: body.severity?.slice(0, 20),
    areaSqft,
    source: (body.source ?? "website").slice(0, 80),
    // utm doubles as a meta catch-all until dedicated columns exist (notes/locality).
    utm: body.utm ?? (body.notes ? { notes: body.notes } : null),
    score,
    scoreTier: tier,
    status: "new",
  });

  // Optional: if a preferred date was given, log a site-visit appointment.
  if (body.preferredDate) {
    const d = new Date(body.preferredDate);
    if (!isNaN(d.getTime())) {
      await db.insert(appointments).values({
        id: randomUUID(),
        tenantId,
        leadId,
        scheduledDate: d,
        status: "scheduled",
      });
    }
  }

  // Audit signal (best-effort; ignore failures).
  void clientIp(c);
  void deviceId(c);

  return c.json({ ok: true, leadId, score, tier });
});
