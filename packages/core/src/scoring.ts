// Lead scoring — turns tracked behaviour into a Hot/Warm/Cold priority.
// Pure function; inputs come from client_events + lead/profile data.
export type LeadTier = "hot" | "warm" | "cold";

export interface ScoringSignals {
  estimatedValue: number; // INR, project value from latest estimate
  service: string;
  toolsUsed: number; // distinct tools used
  usedDeepTool: boolean; // BOQ / AI / photo = high intent
  photoUploaded: boolean;
  repeatVisits: number;
  daysSinceLastActivity: number;
  inServiceArea: boolean;
  contactComplete: boolean; // name + phone + email + address
  respondedToOutreach: boolean;
}

export interface LeadScore {
  score: number; // 0..100
  tier: LeadTier;
  factors: Record<string, number>;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function scoreLead(s: ScoringSignals): LeadScore {
  const factors: Record<string, number> = {};

  // Project value (up to 30): ₹2L+ maxes out.
  factors.value = clamp((s.estimatedValue / 200000) * 30, 0, 30);
  // Engagement depth (up to 25).
  factors.depth = clamp(s.toolsUsed * 4 + (s.usedDeepTool ? 8 : 0) + (s.photoUploaded ? 9 : 0), 0, 25);
  // Repeat interest (up to 12).
  factors.repeat = clamp(s.repeatVisits * 4, 0, 12);
  // Recency (up to 13): decays after a week.
  factors.recency = clamp(13 - s.daysSinceLastActivity * 1.8, 0, 13);
  // Fit (up to 12).
  factors.fit = (s.inServiceArea ? 8 : 0) + (s.contactComplete ? 4 : 0);
  // Responsiveness (up to 8).
  factors.response = s.respondedToOutreach ? 8 : 0;

  const score = Math.round(clamp(Object.values(factors).reduce((a, b) => a + b, 0)));
  const tier: LeadTier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  return { score, tier, factors };
}
