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
