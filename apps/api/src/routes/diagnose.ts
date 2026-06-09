// Photo AI diagnosis — cost cascade §6. OTP-gated; cheap rejections first, the
// paid Gemini call last. Junk/duplicates earn strikes that escalate to bans.
import { Hono } from "hono";
import { and, eq, gte, or, sql } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import { getDb, photoAnalyses, spamSignals, bans } from "@wpx/db";
import { getDefaultTenantId, activeBan } from "../auth/repo";
import { banDurationMs } from "../auth/antispam";
import { clientIp, deviceId, requireVerified, getVerified } from "../auth/guards";
import { diagnosePhoto, geminiKey, type PhotoDiagnosis } from "../ai/gemini";

export const diagnoseRoutes = new Hono();

const OK_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;
const DAILY_QUOTA = 5;
const DAY = 86_400_000;

interface DiagnoseBody {
  imageBase64?: string; // raw base64 (no data: prefix)
  mime?: string;
}

/** Record a strike and escalate to a ban when the running count crosses tiers. */
async function strikeAndMaybeBan(
  kind: "irrelevant_image" | "duplicate_image",
  ip: string,
  dev: string,
  phoneHash: string | undefined,
) {
  const db = getDb();
  await db.insert(spamSignals).values({ id: randomUUID(), kind, ip, deviceId: dev, phoneHash });

  // Count this actor's strikes in the last 30 days (any of ip / device / phone).
  const checks = [
    eq(spamSignals.ip, ip),
    eq(spamSignals.deviceId, dev),
    phoneHash ? eq(spamSignals.phoneHash, phoneHash) : undefined,
  ].filter(Boolean) as any[];
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(spamSignals)
    .where(and(or(...checks), gte(spamSignals.createdAt, new Date(Date.now() - 30 * DAY))));
  const strikeCount = Number(rows[0]?.n ?? 1);

  const durMs = banDurationMs(strikeCount);
  const expiresAt = durMs === null ? null : new Date(Date.now() + durMs);
  await db.insert(bans).values({
    id: randomUUID(), ip, deviceId: dev, reason: `photo_${kind}`, strikeCount, expiresAt,
  });
  return { strikeCount, expiresAt };
}

diagnoseRoutes.post("/", requireVerified, async (c) => {
  const v = await getVerified(c);
  const ip = clientIp(c);
  const dev = deviceId(c);
  const phoneHash = v?.phoneHash;
  const contactId = v?.contactId ?? null;

  if (!geminiKey()) return c.json({ error: "ai_unavailable" }, 503);

  // 2. durable ban gate
  if (await activeBan(ip, dev)) return c.json({ error: "blocked" }, 403);

  const body = await c.req.json<DiagnoseBody>().catch(() => null);
  if (!body?.imageBase64 || !body.mime) return c.json({ error: "bad_body" }, 400);
  if (!OK_MIME.has(body.mime)) return c.json({ error: "bad_type" }, 400);

  // base64 → byte length estimate (cheap, before any work)
  const approxBytes = Math.floor((body.imageBase64.length * 3) / 4);
  if (approxBytes > MAX_BYTES) return c.json({ error: "too_large" }, 413);

  const db = getDb();
  const tenantId = await getDefaultTenantId();

  // 6b. daily quota per contact
  if (contactId) {
    const q = await db
      .select({ n: sql<number>`count(*)` })
      .from(photoAnalyses)
      .where(and(
        eq(photoAnalyses.tenantId, tenantId),
        eq(photoAnalyses.contactId, contactId),
        gte(photoAnalyses.createdAt, new Date(Date.now() - DAY)),
      ));
    if (Number(q[0]?.n ?? 0) >= DAILY_QUOTA) return c.json({ error: "daily_quota", limit: DAILY_QUOTA }, 429);
  }

  // 3. exact-duplicate hash (cache hit returns free; dup from THIS contact → strike)
  const phash = createHash("sha256").update(body.imageBase64).digest("hex").slice(0, 64);
  const cached = await db
    .select({ id: photoAnalyses.id, result: photoAnalyses.result, rejected: photoAnalyses.rejected, contactId: photoAnalyses.contactId })
    .from(photoAnalyses)
    .where(and(eq(photoAnalyses.tenantId, tenantId), eq(photoAnalyses.phash, phash)))
    .limit(1);

  if (cached[0]) {
    if (cached[0].rejected) {
      // Only strike the contact that earned the rejection. A different verified
      // user uploading the same image gets a plain rejection, not a strike —
      // one bad image can't poison the hash for the whole tenant.
      if (cached[0].contactId === contactId) {
        const pen = await strikeAndMaybeBan("duplicate_image", ip, dev, phoneHash);
        return c.json({ error: "rejected", reason: "irrelevant", strike: pen.strikeCount }, 422);
      }
      return c.json({ error: "rejected", reason: "irrelevant" }, 422);
    }
    return c.json({ ok: true, cached: true, diagnosis: cached[0].result });
  }

  // 5. the one paid Gemini Flash call (relevance + diagnosis together)
  const diag: PhotoDiagnosis | null = await diagnosePhoto(body.imageBase64, body.mime);
  if (!diag) return c.json({ error: "ai_failed" }, 502);

  if (!diag.is_waterproofing_surface) {
    await db.insert(photoAnalyses).values({
      id: randomUUID(), tenantId, contactId, phash, isWaterproofingSurface: false,
      result: diag as never, rejected: true,
    });
    const pen = await strikeAndMaybeBan("irrelevant_image", ip, dev, phoneHash);
    return c.json({ error: "rejected", reason: "not_waterproofing_surface", strike: pen.strikeCount }, 422);
  }

  await db.insert(photoAnalyses).values({
    id: randomUUID(), tenantId, contactId, phash, isWaterproofingSurface: true,
    result: diag as never, rejected: false,
  });

  return c.json({ ok: true, cached: false, diagnosis: diag });
});
