// Tenant pricing config — persisted in org_settings[pricing_config], merged over
// the seed DEFAULT_PRICING_CONFIG. Owner edits here propagate to every calculator
// (quick range + exact estimate) on the next cache refresh.
import { and, eq } from "drizzle-orm";
import { getDb, orgSettings } from "@wpx/db";
import { DEFAULT_PRICING_CONFIG, type PricingConfig, type ServiceType, type Severity, type Tier } from "@wpx/core";

const KEY = "pricing_config";
const TTL_MS = 30_000;

const cache = new Map<string, { cfg: PricingConfig; at: number }>();

const SERVICES: ServiceType[] = ["terrace", "roof", "bathroom", "wall", "basement", "tank", "pool", "facade", "balcony"];
const SEVERITIES: Severity[] = ["minor", "moderate", "severe", "critical"];
const TIERS: Tier[] = ["basic", "medium", "premium"];

const num = (v: unknown, fallback: number, min: number, max: number): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** Coerce arbitrary input into a valid, clamped PricingConfig (no trust in caller). */
export function sanitizeConfig(input: unknown): PricingConfig {
  const i = (input ?? {}) as Record<string, unknown>;
  const d = DEFAULT_PRICING_CONFIG;
  const baseIn = (i.baseRatePerSqft ?? {}) as Record<string, unknown>;
  const sevIn = (i.severityMult ?? {}) as Record<string, unknown>;
  const tierIn = (i.tierMult ?? {}) as Record<string, unknown>;

  return {
    version: typeof i.version === "string" ? i.version.slice(0, 64) : d.version,
    currency: "INR",
    baseRatePerSqft: Object.fromEntries(
      SERVICES.map((s) => [s, num(baseIn[s], d.baseRatePerSqft[s], 1, 100_000)]),
    ) as Record<ServiceType, number>,
    severityMult: Object.fromEntries(
      SEVERITIES.map((s) => [s, num(sevIn[s], d.severityMult[s], 0.1, 10)]),
    ) as Record<Severity, number>,
    tierMult: Object.fromEntries(
      TIERS.map((t) => [t, num(tierIn[t], d.tierMult[t], 0.1, 10)]),
    ) as Record<Tier, number>,
    rangeBandPct: num(i.rangeBandPct, d.rangeBandPct, 0, 0.9),
    gstPct: num(i.gstPct, d.gstPct, 0, 100),
    wastagePct: num(i.wastagePct, d.wastagePct, 0, 100),
  };
}

export async function loadPricingConfig(tenantId: string): Promise<PricingConfig> {
  const hit = cache.get(tenantId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.cfg;

  const rows = await getDb()
    .select({ value: orgSettings.value })
    .from(orgSettings)
    .where(and(eq(orgSettings.tenantId, tenantId), eq(orgSettings.key, KEY)))
    .limit(1);

  const cfg = rows[0]?.value ? sanitizeConfig(rows[0].value) : DEFAULT_PRICING_CONFIG;
  cache.set(tenantId, { cfg, at: Date.now() });
  return cfg;
}

export async function savePricingConfig(tenantId: string, input: unknown): Promise<PricingConfig> {
  const cfg = sanitizeConfig(input);
  // Stamp a fresh version so saved quotes can lock the exact rates used.
  const stamped: PricingConfig = { ...cfg, version: `t-${tenantId.slice(0, 8)}-${cfg.version}` };
  const db = getDb();
  const existing = await db
    .select({ id: orgSettings.id })
    .from(orgSettings)
    .where(and(eq(orgSettings.tenantId, tenantId), eq(orgSettings.key, KEY)))
    .limit(1);

  if (existing[0]) {
    await db.update(orgSettings).set({ value: stamped as never }).where(eq(orgSettings.id, existing[0].id));
  } else {
    const { randomUUID } = await import("node:crypto");
    await db.insert(orgSettings).values({ id: randomUUID(), tenantId, key: KEY, value: stamped as never });
  }
  cache.set(tenantId, { cfg: stamped, at: Date.now() });
  return stamped;
}
