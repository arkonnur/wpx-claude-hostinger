// Seed brand catalog — published warranty terms + recommended system per brand.
// Ported/condensed from folder `1` brands.ts. In production this is editable by
// super-admin (brand_specs table); this object is the seed/default only.
export interface BrandSpec {
  name: string;
  warrantyYears: number[];
  flagshipSystem: string;
  primer: string;
  membrane: string;
  topcoat: string;
  reinforcement: string;
  tier: "basic" | "medium" | "premium";
}

export const SEED_BRANDS: Record<string, BrandSpec> = {
  "Dr. Fixit": {
    name: "Dr. Fixit",
    warrantyYears: [5, 7, 10],
    flagshipSystem: "Roofseal Flex / Newcoat",
    primer: "Dr. Fixit Primeseal",
    membrane: "Roofseal Flex (2 coats, cross direction)",
    topcoat: "Newcoat Cool",
    reinforcement: "Fibreglass mesh 60 gsm at corners & joints",
    tier: "medium",
  },
  "Asian Paints SmartCare": {
    name: "Asian Paints SmartCare",
    warrantyYears: [5, 7, 10],
    flagshipSystem: "Damp Proof Ultra / Hi-Flex",
    primer: "SmartCare Damp Block Primer",
    membrane: "SmartCare Damp Proof Ultra (2 coats)",
    topcoat: "SmartCare Roof Cool",
    reinforcement: "SmartCare reinforcement fabric at junctions",
    tier: "medium",
  },
  "Sika": {
    name: "Sika",
    warrantyYears: [5, 10, 15],
    flagshipSystem: "Sikalastic / Sikatop Seal",
    primer: "Sika Primer-3N",
    membrane: "Sikalastic-560 (2 coats) or Sikatop Seal 107",
    topcoat: "Sikalastic UV Topcoat",
    reinforcement: "Sika Reemat Premium",
    tier: "premium",
  },
  "Fosroc": {
    name: "Fosroc",
    warrantyYears: [5, 10],
    flagshipSystem: "Brushbond / Proofex",
    primer: "Nitoprime",
    membrane: "Brushbond RFX (2 coats)",
    topcoat: "Dekguard reflective",
    reinforcement: "Nitobond reinforcement",
    tier: "premium",
  },
};
