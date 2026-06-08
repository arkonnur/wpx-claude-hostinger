// Client-event tracking. Public, fire-and-forget telemetry that powers the
// contact timeline, engagement scoring, and tool funnels. Anchored to a verified
// contact when known, else to an anonymous sessionId from the browser.
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { getDb, clientEvents } from "@wpx/db";
import { getDefaultTenantId, activeBan } from "../auth/repo";
import { clientIp, deviceId, getVerified } from "../auth/guards";

export const eventRoutes = new Hono();

// Allowlist of trackable event types — anything else is dropped (anti-junk).
const EVENT_TYPES = new Set([
  "tool_view",
  "calculator_run",
  "estimate_view",
  "diagnose_start",
  "diagnose_result",
  "report_view",
  "warranty_check",
  "book_open",
  "lead_submit",
  "otp_verified",
  "signup",
  "login",
]);

const MAX_PAYLOAD_BYTES = 4_000;
const MAX_SESSION_LEN = 64;

// Light per-IP burst guard (best-effort, resets on restart).
const ipHits = new Map<string, number[]>();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 60; // generous: telemetry is high-frequency
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  ipHits.set(ip, arr);
  if (ipHits.size > 5000) ipHits.clear();
  return arr.length > RL_MAX;
}

interface EventBody {
  type: string;
  sessionId?: string;
  payload?: unknown;
}

eventRoutes.post("/", async (c) => {
  const body = await c.req.json<EventBody>().catch(() => null);
  if (!body || !EVENT_TYPES.has(body.type)) return c.json({ ok: true }); // silently drop junk

  const ip = clientIp(c);
  const dev = deviceId(c);
  if (await activeBan(ip, dev)) return c.json({ ok: true });
  if (rateLimited(ip)) return c.json({ ok: true, dropped: true });

  let payload: unknown = null;
  if (body.payload !== undefined && body.payload !== null) {
    const json = JSON.stringify(body.payload);
    if (json.length <= MAX_PAYLOAD_BYTES) payload = body.payload;
  }
  const sessionId = body.sessionId ? String(body.sessionId).slice(0, MAX_SESSION_LEN) : null;

  // Attach to the verified contact when we have one (cross-references the timeline).
  const v = await getVerified(c);
  const tenantId = await getDefaultTenantId();

  await getDb().insert(clientEvents).values({
    id: randomUUID(),
    tenantId,
    contactId: v?.contactId ?? null,
    sessionId,
    type: body.type,
    payload: payload as never,
  });

  return c.json({ ok: true });
});
