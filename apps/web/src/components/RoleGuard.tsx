import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import type { Role } from "@wpx/types";
import { useSession } from "../lib/session";

// Client-side guard. (API enforces real authz server-side via requireRole.)
export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { loading, role } = useSession();
  if (loading) return <div className="p-8 text-white/50">Loading…</div>;
  if (!role) return <Navigate to="/" />;
  if (!allow.includes(role)) return <Navigate to={roleHome(role)} />;
  return <>{children}</>;
}

export function roleHome(role: Role): string {
  switch (role) {
    case "owner": return "/owner";
    case "admin": return "/admin";
    case "employee": return "/crew";
    default: return "/portal";
  }
}

// Single source of truth for how each role is presented (label + badge colors).
export const ROLE_META: Record<Role, { label: string; badge: string; surface: string }> = {
  owner: { label: "Owner", badge: "bg-violet-500/15 text-violet-300 ring-violet-400/30", surface: "Platform control" },
  admin: { label: "Admin", badge: "bg-blue-500/15 text-blue-300 ring-blue-400/30", surface: "Operations & pipeline" },
  employee: { label: "Field crew", badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30", surface: "Assigned work" },
  client: { label: "Customer", badge: "bg-sky-500/15 text-sky-300 ring-sky-400/30", surface: "My account" },
};

// Staff roles get redirected straight to their dashboard instead of the public tool hub.
export const STAFF_ROLES: Role[] = ["owner", "admin", "employee"];
