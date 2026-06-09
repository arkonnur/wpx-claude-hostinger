// Phase 8 — product/brand catalog. Owner-managed; feeds material picks in
// quotes and the execution checklist. Soft-delete (active flag) to preserve
// references from historic quotes/jobs.
import { Hono } from "hono";
import { and, eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, products } from "@wpx/db";
import { requireRole, getSession } from "../auth/guards";

export const productRoutes = new Hono();

const TIERS = ["basic", "medium", "premium", "industrial"] as const;
type Tier = (typeof TIERS)[number];

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : undefined);
function num(v: unknown, lo: number, hi: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, n));
}

interface ProductBody {
  brand?: string; name?: string; category?: string;
  coverageValue?: number | string; coverageUnit?: string;
  packSize?: number | string; packUnit?: string;
  mrp?: number | string; costPrice?: number | string; marginPct?: number | string;
  tier?: string; active?: boolean;
}

function sanitize(body: ProductBody): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (body.brand !== undefined) out.brand = clip(body.brand, 120) || "";
  if (body.name !== undefined) out.name = clip(body.name, 191) || "";
  if (body.category !== undefined) out.category = clip(body.category, 80) ?? null;
  if (body.coverageValue !== undefined) out.coverageValue = body.coverageValue === "" ? null : num(body.coverageValue, 0, 1e7);
  if (body.coverageUnit !== undefined) out.coverageUnit = clip(body.coverageUnit, 20) ?? null;
  if (body.packSize !== undefined) out.packSize = body.packSize === "" ? null : num(body.packSize, 0, 1e7);
  if (body.packUnit !== undefined) out.packUnit = clip(body.packUnit, 20) ?? null;
  if (body.mrp !== undefined) out.mrp = body.mrp === "" ? null : num(body.mrp, 0, 1e9);
  if (body.costPrice !== undefined) out.costPrice = body.costPrice === "" ? null : num(body.costPrice, 0, 1e9);
  if (body.marginPct !== undefined) out.marginPct = body.marginPct === "" ? null : num(body.marginPct, -100, 1000);
  if (body.tier !== undefined) out.tier = (TIERS as readonly string[]).includes(body.tier ?? "") ? (body.tier as Tier) : null;
  if (body.active !== undefined) out.active = !!body.active;
  return out;
}

/** List catalog for the tenant (active first). Admin + owner. */
productRoutes.get("/", requireRole("admin", "owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const db = getDb();
  const rows = await db.select().from(products)
    .where(eq(products.tenantId, s.tenantId))
    .orderBy(desc(products.active), desc(products.createdAt))
    .limit(1000);
  return c.json({ products: rows });
});

/** Create a product (owner). */
productRoutes.post("/", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const body = await c.req.json<ProductBody>().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);
  const fields = sanitize(body);
  if (!fields.brand || !fields.name) return c.json({ error: "brand_and_name_required" }, 400);
  const id = randomUUID();
  const db = getDb();
  await db.insert(products).values({ id, tenantId: s.tenantId, active: true, ...fields } as typeof products.$inferInsert);
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return c.json({ product: rows[0] });
});

/** Update a product (owner). Partial. */
productRoutes.patch("/:id", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const id = c.req.param("id");
  const body = await c.req.json<ProductBody>().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);
  const fields = sanitize(body);
  if (!Object.keys(fields).length) return c.json({ error: "nothing_to_update" }, 400);
  const db = getDb();
  const res = await db.update(products).set(fields).where(and(eq(products.id, id), eq(products.tenantId, s.tenantId)));
  const affected = (res as unknown as { affectedRows?: number }[])[0]?.affectedRows ?? 0;
  if (!affected) return c.json({ error: "not_found" }, 404);
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return c.json({ product: rows[0] });
});

/** Soft-delete (deactivate) a product (owner). Keeps historic references intact. */
productRoutes.delete("/:id", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const id = c.req.param("id");
  const db = getDb();
  const res = await db.update(products).set({ active: false }).where(and(eq(products.id, id), eq(products.tenantId, s.tenantId)));
  const affected = (res as unknown as { affectedRows?: number }[])[0]?.affectedRows ?? 0;
  if (!affected) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true, id });
});
