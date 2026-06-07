// Unified pricing engine — single source of truth for ALL calculators.
// Replaces the 5 duplicate calc implementations across the prototype apps.
// Fully config-driven: rates/multipliers/tiers come from PricingConfig (loaded
// per-tenant from DB), never hardcoded. The DEFAULT_PRICING_CONFIG below is only
// a seed; super-admin edits propagate by passing a fresh config.
import { toSqft } from "./units";

export type ServiceType =
  | "terrace"
  | "roof"
  | "bathroom"
  | "wall"
  | "basement"
  | "tank"
  | "pool"
  | "facade"
  | "balcony";

export type Severity = "minor" | "moderate" | "severe" | "critical";
export type Tier = "basic" | "medium" | "premium";

export interface PricingConfig {
  /** version stamp; saved quotes lock this. */
  version: string;
  currency: string;
  /** INR per sqft base rate per service (the "medium" tier baseline). */
  baseRatePerSqft: Record<ServiceType, number>;
  /** severity multipliers applied to base. */
  severityMult: Record<Severity, number>;
  /** tier multipliers (basic cheaper, premium dearer). */
  tierMult: Record<Tier, number>;
  /** +/- band used to derive the no-OTP min..max range from the point estimate. */
  rangeBandPct: number;
  /** GST percentage applied to subtotal. */
  gstPct: number;
  /** material wastage percentage. */
  wastagePct: number;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  version: "seed-2026-06",
  currency: "INR",
  baseRatePerSqft: {
    terrace: 65,
    roof: 58,
    bathroom: 135,
    wall: 50,
    basement: 185,
    tank: 110,
    pool: 150,
    facade: 58,
    balcony: 90,
  },
  severityMult: { minor: 0.85, moderate: 1.0, severe: 1.3, critical: 1.6 },
  tierMult: { basic: 0.8, medium: 1.0, premium: 1.35 },
  rangeBandPct: 0.18,
  gstPct: 18,
  wastagePct: 10,
};

export interface QuickRangeInput {
  service: ServiceType;
  area: number;
  unit?: "sqft" | "sqm" | "sqyd";
  severity?: Severity;
}

export interface QuickRangeResult {
  service: ServiceType;
  areaSqft: number;
  severity: Severity;
  min: number;
  max: number;
  configVersion: string;
}

/** TIER 0 (no OTP): returns only a min..max band. Never the exact figure. */
export function quickRange(input: QuickRangeInput, cfg: PricingConfig = DEFAULT_PRICING_CONFIG): QuickRangeResult {
  const severity = input.severity ?? "moderate";
  const areaSqft = toSqft(input.area, input.unit ?? "sqft");
  const base = cfg.baseRatePerSqft[input.service] ?? 60;
  const point = areaSqft * base * cfg.severityMult[severity];
  const band = cfg.rangeBandPct;
  return {
    service: input.service,
    areaSqft: Math.round(areaSqft),
    severity,
    min: Math.round(point * (1 - band)),
    max: Math.round(point * (1 + band)),
    configVersion: cfg.version,
  };
}

export interface TierEstimate {
  tier: Tier;
  ratePerSqft: number;
  materialAndLabour: number;
  wastage: number;
  subtotal: number;
  gst: number;
  total: number;
}

export interface ExactEstimateInput extends QuickRangeInput {
  tiers?: Tier[];
}

export interface ExactEstimateResult {
  service: ServiceType;
  areaSqft: number;
  severity: Severity;
  tiers: TierEstimate[];
  configVersion: string;
}

/** TIER 1 (OTP verified): exact tiered estimate (basic/medium/premium). */
export function exactEstimate(
  input: ExactEstimateInput,
  cfg: PricingConfig = DEFAULT_PRICING_CONFIG,
): ExactEstimateResult {
  const severity = input.severity ?? "moderate";
  const areaSqft = toSqft(input.area, input.unit ?? "sqft");
  const base = cfg.baseRatePerSqft[input.service] ?? 60;
  const tiers = (input.tiers ?? ["basic", "medium", "premium"]).map((tier): TierEstimate => {
    const ratePerSqft = +(base * cfg.tierMult[tier] * cfg.severityMult[severity]).toFixed(2);
    const materialAndLabour = areaSqft * ratePerSqft;
    const wastage = materialAndLabour * (cfg.wastagePct / 100);
    const subtotal = materialAndLabour + wastage;
    const gst = subtotal * (cfg.gstPct / 100);
    return {
      tier,
      ratePerSqft,
      materialAndLabour: Math.round(materialAndLabour),
      wastage: Math.round(wastage),
      subtotal: Math.round(subtotal),
      gst: Math.round(gst),
      total: Math.round(subtotal + gst),
    };
  });
  return { service: input.service, areaSqft: Math.round(areaSqft), severity, tiers, configVersion: cfg.version };
}
