// Pricing routes — the public no-OTP range + the gated exact tiered estimate.
// Both use the single @wpx/core engine with the tenant's saved PricingConfig.
import { Hono } from "hono";
import {
  quickRange,
  exactEstimate,
  type ServiceType,
  type Severity,
} from "@wpx/core";
import { requireVerified } from "../auth/guards";
import { getDefaultTenantId } from "../auth/repo";
import { loadPricingConfig } from "../config/pricing";

export const pricingRoutes = new Hono();

// TIER 0 — no OTP. Returns only a min..max band.
pricingRoutes.post("/quick", async (c) => {
  const body = await c.req.json<{ service: ServiceType; area: number; unit?: any; severity?: Severity }>();
  if (!body?.service || !body?.area) return c.json({ error: "service and area required" }, 400);
  const cfg = await loadPricingConfig(await getDefaultTenantId());
  return c.json(quickRange(body, cfg));
});

// TIER 1 — gated. requireVerified enforces the wpx_verified cookie (OTP done once).
pricingRoutes.post("/exact", requireVerified, async (c) => {
  const body = await c.req.json<{ service: ServiceType; area: number; unit?: any; severity?: Severity }>();
  if (!body?.service || !body?.area) return c.json({ error: "service and area required" }, 400);
  const cfg = await loadPricingConfig(await getDefaultTenantId());
  return c.json(exactEstimate(body, cfg));
});
