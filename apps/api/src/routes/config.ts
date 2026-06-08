// Owner config — live pricing. Owner edits propagate to every calculator.
import { Hono } from "hono";
import { requireRole, getSession } from "../auth/guards";
import { loadPricingConfig, savePricingConfig } from "../config/pricing";
import { loadToolConfigs, saveToolConfigs } from "../config/tools";
import { getDefaultTenantId } from "../auth/repo";

export const configRoutes = new Hono();

/** Current tenant pricing config (owner only — exposes margins/rates). */
configRoutes.get("/pricing", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  return c.json({ config: await loadPricingConfig(s.tenantId) });
});

/** Replace the tenant pricing config (validated + clamped server-side). */
configRoutes.put("/pricing", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "bad_body" }, 400);
  const saved = await savePricingConfig(s.tenantId, body);
  return c.json({ ok: true, config: saved });
});

/** Public tool gating for the default tenant — ToolHub renders/sorts/gates from this. */
configRoutes.get("/tools", async (c) => {
  const tenantId = await getDefaultTenantId();
  return c.json({ tools: await loadToolConfigs(tenantId) });
});

/** Replace the tenant tool gating (owner only). */
configRoutes.put("/tools", requireRole("owner"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);
  const body = await c.req.json().catch(() => null);
  if (!Array.isArray(body)) return c.json({ error: "bad_body" }, 400);
  const saved = await saveToolConfigs(s.tenantId, body);
  return c.json({ ok: true, tools: saved });
});
