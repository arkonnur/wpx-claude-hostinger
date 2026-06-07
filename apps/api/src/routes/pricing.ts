// Pricing routes — the public no-OTP range + the gated exact tiered estimate.
// Both use the single @wpx/core engine. (Auth gating wired in Phase 3.)
import { Hono } from "hono";
import {
  quickRange,
  exactEstimate,
  DEFAULT_PRICING_CONFIG,
  type ServiceType,
  type Severity,
} from "@wpx/core";
import { requireVerified } from "../auth/guards";

export const pricingRoutes = new Hono();

// TODO(Phase 3): load tenant PricingConfig from DB (price_lists) instead of default.
function loadConfig(_tenantId?: string) {
  return DEFAULT_PRICING_CONFIG;
}

// TIER 0 — no OTP. Returns only a min..max band.
pricingRoutes.post("/quick", async (c) => {
  const body = await c.req.json<{ service: ServiceType; area: number; unit?: any; severity?: Severity }>();
  if (!body?.service || !body?.area) return c.json({ error: "service and area required" }, 400);
  const result = quickRange(body, loadConfig());
  return c.json(result);
});

// TIER 1 — gated. requireVerified enforces the wpx_verified cookie (OTP done once).
pricingRoutes.post("/exact", requireVerified, async (c) => {
  const body = await c.req.json<{ service: ServiceType; area: number; unit?: any; severity?: Severity }>();
  if (!body?.service || !body?.area) return c.json({ error: "service and area required" }, 400);
  const result = exactEstimate(body, loadConfig());
  return c.json(result);
});
