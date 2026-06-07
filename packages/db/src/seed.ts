// Seed a default tenant with config-driven defaults (products, price list,
// formula set, tool configs). Run once MySQL is reachable: `npm run db:seed`.
import { randomUUID } from "node:crypto";
import { getDb, tenants, priceLists, formulaSets, toolConfigs, brandSpecs } from "./index";
import { DEFAULT_PRICING_CONFIG, SEED_BRANDS, formulaFingerprint } from "@wpx/core";

const DEFAULT_FORMULAS = {
  wastage_pct: 10,
  contingency_pct: 5,
  labor_rate_per_sqft: 18,
  rainfall_bangalore_mm: 970,
};

// gate: public/otp/account · access: self_serve/site_visit_only (MASTER_BUILD_SPEC §5,§20)
const TOOLS: Array<{ key: string; gate: "public" | "otp" | "account"; access: "self_serve" | "site_visit_only"; order: number }> = [
  { key: "quick_cost_range", gate: "public", access: "self_serve", order: 1 },
  { key: "area_shape_calc", gate: "public", access: "self_serve", order: 2 },
  { key: "material_coverage", gate: "public", access: "self_serve", order: 3 },
  { key: "warranty_decoder", gate: "public", access: "self_serve", order: 4 },
  { key: "leak_risk_quiz", gate: "public", access: "self_serve", order: 5 },
  { key: "system_selector", gate: "public", access: "self_serve", order: 6 },
  { key: "exact_estimate", gate: "otp", access: "self_serve", order: 7 },
  { key: "photo_diagnosis", gate: "otp", access: "self_serve", order: 8 },
  { key: "full_boq", gate: "account", access: "self_serve", order: 9 },
  { key: "pre_inspection", gate: "account", access: "site_visit_only", order: 10 },
  { key: "moisture_map", gate: "account", access: "site_visit_only", order: 11 },
  { key: "structural_assessment", gate: "account", access: "site_visit_only", order: 12 },
];

async function main() {
  const db = getDb();
  const tenantId = randomUUID();
  await db.insert(tenants).values({
    id: tenantId,
    name: "WaterProofX",
    slug: "waterproofx",
    pricingConfig: DEFAULT_PRICING_CONFIG as any,
    status: "active",
  });
  await db.insert(priceLists).values({
    tenantId,
    version: DEFAULT_PRICING_CONFIG.version,
    rates: { baseRatePerSqft: DEFAULT_PRICING_CONFIG.baseRatePerSqft } as any,
    active: true,
  });
  await db.insert(formulaSets).values({
    tenantId,
    version: "seed-2026-06",
    fingerprint: formulaFingerprint(DEFAULT_FORMULAS),
    formulas: DEFAULT_FORMULAS as any,
    active: true,
  });
  for (const [name, spec] of Object.entries(SEED_BRANDS)) {
    await db.insert(brandSpecs).values({ tenantId, name, spec: spec as any, active: true });
  }
  for (const t of TOOLS) {
    await db.insert(toolConfigs).values({
      tenantId,
      toolKey: t.key,
      enabled: true,
      sortOrder: t.order,
      gate: t.gate,
      access: t.access,
    });
  }
  console.log(`[seed] tenant ${tenantId} seeded with ${TOOLS.length} tools, ${Object.keys(SEED_BRANDS).length} brands.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
