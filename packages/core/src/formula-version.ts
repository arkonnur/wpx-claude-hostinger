// Stable fingerprint for a formula snapshot. Used in exports, saved quotes and
// AI BOQ audit trail so reviewers know exactly which constants priced an estimate.
// Ported from wpx-boq (canonical).
export function formulaFingerprint(formulas: Record<string, unknown>): string {
  const keys = Object.keys(formulas).sort();
  const canonical = keys.map((k) => `${k}=${JSON.stringify(formulas[k])}`).join("|");
  // Tiny non-crypto hash (FNV-1a 32-bit) — deterministic & dependency-free.
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return "f_" + h.toString(16).padStart(8, "0");
}

export const FORMULA_KEYS_FOR_EXPORT = [
  "wastage_pct",
  "contingency_pct",
  "labor_rate_per_sqft",
  "screed_min_mm",
  "fillet_default_mm",
  "cement_per_m3_screed",
  "sand_per_m3_screed",
  "sbr_per_bag_cement",
  "sbr_bond_coat_ltr_per_sqm",
  "fillet_cement_per_m3",
  "fillet_sand_per_m3",
  "drain_max_area_sqm",
  "rainfall_bangalore_mm",
  "load_safe_mm",
  "load_caution_mm",
  "load_danger_mm",
] as const;
