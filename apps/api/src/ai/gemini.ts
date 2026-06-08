// Gemini Flash vision — ONE structured call does relevance + diagnosis together
// (cost cascade §6). Never emits confidence %. Already-waterproofed surfaces get
// a genuine condition report, not invented problems.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

export const ALLOWED_SURFACES = [
  "terrace_roof", "interior_wall_ceiling", "bathroom_wet", "pool",
  "water_tank", "exterior_facade", "basement", "balcony",
] as const;

export interface PhotoDiagnosis {
  is_waterproofing_surface: boolean;
  surface_type: string;        // one of ALLOWED_SURFACES, or "other" when false
  already_waterproofed: boolean;
  has_damage: boolean;
  severity: "none" | "minor" | "moderate" | "severe" | "critical";
  cause: string;               // short plain-language cause
  system: string;              // recommended system family (e.g. "APP membrane", "PU coating")
  brand: string;               // indicative brand family or ""
  summary: string;             // 1-2 sentence awareness summary (no confidence %)
  recommendation: string;      // next step (book inspection etc.)
}

// OpenAPI-subset schema Gemini will be forced to fill.
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    is_waterproofing_surface: { type: "boolean" },
    surface_type: { type: "string" },
    already_waterproofed: { type: "boolean" },
    has_damage: { type: "boolean" },
    severity: { type: "string", enum: ["none", "minor", "moderate", "severe", "critical"] },
    cause: { type: "string" },
    system: { type: "string" },
    brand: { type: "string" },
    summary: { type: "string" },
    recommendation: { type: "string" },
  },
  required: [
    "is_waterproofing_surface", "surface_type", "already_waterproofed",
    "has_damage", "severity", "cause", "system", "brand", "summary", "recommendation",
  ],
} as const;

const PROMPT = `You are a senior waterproofing inspector for a Bangalore firm.
Analyse the single attached photo. Allowed surfaces only: terrace/roof, interior
wall or ceiling dampness, bathroom/wet area, swimming pool, water tank, exterior
wall/facade, basement, balcony.

Rules:
- If the image is NOT one of these waterproofing-relevant surfaces (e.g. a person,
  food, screenshot, random object), set is_waterproofing_surface=false and keep
  every other field minimal ("", "none", false).
- If it IS relevant, give a genuine awareness-level read of the visible condition.
- If the surface is already waterproofed and healthy, say so honestly (condition +
  rough remaining life + re-coat timeline). Do NOT invent problems.
- surface_type must be one of: terrace_roof, interior_wall_ceiling, bathroom_wet,
  pool, water_tank, exterior_facade, basement, balcony, other.
- NEVER mention probabilities, confidence percentages, or model uncertainty.
- summary: 1-2 plain sentences a homeowner understands.
- recommendation: the single best next step.`;

export function geminiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

/** One Flash call. Returns null on transport/parse failure (caller decides). */
export async function diagnosePhoto(base64: string, mime: string): Promise<PhotoDiagnosis | null> {
  const key = geminiKey();
  if (!key) return null;

  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mime, data: base64 } },
      ],
    }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  let res: Response;
  try {
    res = await fetch(ENDPOINT(key), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json().catch(() => null) as
    | { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    | null;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    return JSON.parse(text) as PhotoDiagnosis;
  } catch {
    return null;
  }
}
