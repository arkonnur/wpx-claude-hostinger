import { test } from "node:test";
import assert from "node:assert/strict";
import { quickRange, exactEstimate, DEFAULT_PRICING_CONFIG } from "./pricing.ts";

test("quickRange returns a min<max band, never a single figure", () => {
  const r = quickRange({ service: "terrace", area: 1000, severity: "moderate" });
  assert.ok(r.min < r.max);
  assert.equal(r.areaSqft, 1000);
  assert.equal(r.configVersion, DEFAULT_PRICING_CONFIG.version);
});

test("quickRange normalizes sqm to sqft", () => {
  const r = quickRange({ service: "terrace", area: 100, unit: "sqm" });
  assert.equal(r.areaSqft, 1076); // 100 m² ≈ 1076 sqft
});

test("quickRange scales with severity", () => {
  const mild = quickRange({ service: "terrace", area: 1000, severity: "minor" });
  const crit = quickRange({ service: "terrace", area: 1000, severity: "critical" });
  assert.ok(crit.max > mild.max);
});

test("exactEstimate returns three ordered tiers with GST", () => {
  const r = exactEstimate({ service: "bathroom", area: 60, severity: "severe" });
  assert.deepEqual(r.tiers.map((t) => t.tier), ["basic", "medium", "premium"]);
  assert.ok(r.tiers[0]!.total < r.tiers[1]!.total);
  assert.ok(r.tiers[1]!.total < r.tiers[2]!.total);
  for (const t of r.tiers) assert.ok(t.gst > 0);
});

test("exactEstimate respects a custom (super-admin edited) config", () => {
  const custom = {
    ...DEFAULT_PRICING_CONFIG,
    version: "v2",
    baseRatePerSqft: { ...DEFAULT_PRICING_CONFIG.baseRatePerSqft, terrace: 200 },
  };
  const a = exactEstimate({ service: "terrace", area: 1000 });
  const b = exactEstimate({ service: "terrace", area: 1000 }, custom);
  assert.ok(b.tiers[1]!.total > a.tiers[1]!.total);
  assert.equal(b.configVersion, "v2");
});
