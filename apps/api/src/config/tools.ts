// Tenant tool gating — which public tools show, in what order, behind what gate.
// Persisted in tool_configs (one row per toolKey). Owner edits; ToolHub reads the
// public view to render/sort/gate the tool grid.
import { and, eq } from "drizzle-orm";
import { getDb, toolConfigs } from "@wpx/db";
import { randomUUID } from "node:crypto";

export const TOOL_KEYS = ["diagnose", "calculator", "estimate", "book", "warranty", "report"] as const;
export type ToolKey = (typeof TOOL_KEYS)[number];
const GATES = ["public", "otp", "account"] as const;
type GateLevel = (typeof GATES)[number];
const ACCESS = ["self_serve", "site_visit_only"] as const;
type AccessLevel = (typeof ACCESS)[number];

export interface ToolConfig {
  toolKey: ToolKey;
  enabled: boolean;
  sortOrder: number;
  gate: GateLevel;
  access: AccessLevel;
}

// Seed defaults mirror the original hardcoded ToolHub grid.
const DEFAULTS: Record<ToolKey, ToolConfig> = {
  diagnose:   { toolKey: "diagnose",   enabled: true, sortOrder: 0, gate: "otp",     access: "self_serve" },
  calculator: { toolKey: "calculator", enabled: true, sortOrder: 1, gate: "public",  access: "self_serve" },
  estimate:   { toolKey: "estimate",   enabled: true, sortOrder: 2, gate: "otp",     access: "self_serve" },
  book:       { toolKey: "book",       enabled: true, sortOrder: 3, gate: "public",  access: "self_serve" },
  warranty:   { toolKey: "warranty",   enabled: true, sortOrder: 4, gate: "public",  access: "self_serve" },
  report:     { toolKey: "report",     enabled: true, sortOrder: 5, gate: "account", access: "self_serve" },
};

const TTL_MS = 30_000;
const cache = new Map<string, { rows: ToolConfig[]; at: number }>();

/** Effective tool configs for a tenant — DB overrides merged over seed defaults. */
export async function loadToolConfigs(tenantId: string): Promise<ToolConfig[]> {
  const hit = cache.get(tenantId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rows;

  const db = getDb();
  const rows = await db.select().from(toolConfigs).where(eq(toolConfigs.tenantId, tenantId));
  const byKey = new Map(rows.map((r) => [r.toolKey, r]));
  const merged: ToolConfig[] = TOOL_KEYS.map((k) => {
    const d = DEFAULTS[k];
    const o = byKey.get(k);
    if (!o) return d;
    return {
      toolKey: k,
      enabled: o.enabled,
      sortOrder: o.sortOrder ?? d.sortOrder,
      gate: (GATES as readonly string[]).includes(o.gate) ? (o.gate as GateLevel) : d.gate,
      access: (ACCESS as readonly string[]).includes(o.access) ? (o.access as AccessLevel) : d.access,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  cache.set(tenantId, { rows: merged, at: Date.now() });
  return merged;
}

/** Replace tool configs for a tenant (validated + clamped). Upsert per toolKey. */
export async function saveToolConfigs(tenantId: string, input: unknown): Promise<ToolConfig[]> {
  const arr = Array.isArray(input) ? input : [];
  const byKey = new Map<string, ToolConfig>();
  for (const raw of arr) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const key = String(r.toolKey ?? "");
    if (!(TOOL_KEYS as readonly string[]).includes(key)) continue;
    byKey.set(key, {
      toolKey: key as ToolKey,
      enabled: r.enabled !== false,
      sortOrder: Number.isFinite(Number(r.sortOrder)) ? Math.max(0, Math.min(99, Math.round(Number(r.sortOrder)))) : DEFAULTS[key as ToolKey].sortOrder,
      gate: (GATES as readonly string[]).includes(String(r.gate)) ? (r.gate as GateLevel) : DEFAULTS[key as ToolKey].gate,
      access: (ACCESS as readonly string[]).includes(String(r.access)) ? (r.access as AccessLevel) : DEFAULTS[key as ToolKey].access,
    });
  }

  const db = getDb();
  const existing = await db.select({ id: toolConfigs.id, toolKey: toolConfigs.toolKey })
    .from(toolConfigs).where(eq(toolConfigs.tenantId, tenantId));
  const existingByKey = new Map(existing.map((e) => [e.toolKey, e.id]));

  for (const cfg of byKey.values()) {
    const id = existingByKey.get(cfg.toolKey);
    if (id) {
      await db.update(toolConfigs)
        .set({ enabled: cfg.enabled, sortOrder: cfg.sortOrder, gate: cfg.gate, access: cfg.access })
        .where(and(eq(toolConfigs.id, id), eq(toolConfigs.tenantId, tenantId)));
    } else {
      await db.insert(toolConfigs).values({
        id: randomUUID(), tenantId, toolKey: cfg.toolKey,
        enabled: cfg.enabled, sortOrder: cfg.sortOrder, gate: cfg.gate, access: cfg.access,
      });
    }
  }
  cache.delete(tenantId);
  return loadToolConfigs(tenantId);
}
