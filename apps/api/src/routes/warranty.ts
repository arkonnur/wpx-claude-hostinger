// Phase 7 — public warranty verification. A QR on the warranty card encodes the
// qrToken; scanning it hits this endpoint. Public (no auth) but reveals only the
// minimum needed to confirm authenticity — never phone/email/address.
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDb, warranties, contacts } from "@wpx/db";

export const warrantyRoutes = new Hono();

/** Verify a warranty card by its QR token. Returns card + masked holder name. */
warrantyRoutes.get("/:qrToken", async (c) => {
  const token = c.req.param("qrToken");
  if (!token || token.length < 16) return c.json({ valid: false }, 404);
  const db = getDb();
  const rows = await db
    .select({
      cardNo: warranties.cardNo, brand: warranties.brand, years: warranties.years,
      issueDate: warranties.issueDate, expiryDate: warranties.expiryDate,
      contactName: contacts.name,
    })
    .from(warranties)
    .leftJoin(contacts, eq(warranties.contactId, contacts.id))
    .where(eq(warranties.qrToken, token))
    .limit(1);
  const w = rows[0];
  if (!w) return c.json({ valid: false }, 404);

  // Mask the holder name (first name + initial) — confirm identity, don't expose PII.
  const masked = (() => {
    const n = (w.contactName ?? "").trim();
    if (!n) return null;
    const parts = n.split(/\s+/);
    return parts.length > 1 ? `${parts[0]} ${parts[1]?.[0] ?? ""}.` : parts[0];
  })();

  const now = Date.now();
  const active = !w.expiryDate || new Date(w.expiryDate).getTime() > now;
  return c.json({
    valid: true,
    active,
    cardNo: w.cardNo,
    brand: w.brand,
    years: w.years,
    issueDate: w.issueDate,
    expiryDate: w.expiryDate,
    holder: masked,
  });
});
