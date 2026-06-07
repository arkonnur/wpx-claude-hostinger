// Scoped repository — the ONLY sanctioned way business data is read/written.
// Enforces tenant (and optional client) isolation in app code since MySQL has
// no RLS. Every call must carry a Scope; cross-tenant/cross-client access is
// impossible through this layer. See MASTER_BUILD_SPEC §3.
import { and, eq, type SQL } from "drizzle-orm";
import { getDb } from "./index";

export interface Scope {
  tenantId: string;
  /** when set, also constrain to a single client (contact). */
  contactId?: string;
  /** actor for audit. */
  actorId?: string;
  role?: "owner" | "admin" | "employee" | "client";
}

/**
 * Build a tenant (+optional contact) WHERE clause for a table that exposes
 * `tenant_id` and (optionally) `contact_id` columns.
 */
export function scopeWhere(
  table: { tenantId: any; contactId?: any },
  scope: Scope,
  extra?: SQL,
): SQL | undefined {
  const parts: (SQL | undefined)[] = [eq(table.tenantId, scope.tenantId)];
  if (scope.contactId && table.contactId) parts.push(eq(table.contactId, scope.contactId));
  if (extra) parts.push(extra);
  return and(...parts.filter(Boolean) as SQL[]);
}

/** Guard for AI context assembly: assert every record belongs to one client. */
export function assertSingleClient<T extends { contactId?: string | null; tenantId?: string }>(
  rows: T[],
  scope: Scope,
): T[] {
  for (const r of rows) {
    if (r.tenantId && r.tenantId !== scope.tenantId) {
      throw new Error("isolation violation: cross-tenant row in AI context");
    }
    if (scope.contactId && r.contactId && r.contactId !== scope.contactId) {
      throw new Error("isolation violation: cross-client row in AI context");
    }
  }
  return rows;
}

export { getDb };
