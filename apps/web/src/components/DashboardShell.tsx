import { type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useSession } from "../lib/session";
import { ROLE_META } from "./RoleGuard";

export interface NavItem {
  to: string;
  label: string;
  /** When set (with onSelect on the shell), this item switches an in-page tab instead of routing. */
  key?: string;
}

export function DashboardShell({ title, nav, children, activeKey, onSelect }: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
  activeKey?: string;
  onSelect?: (key: string) => void;
}) {
  const { me, signOut } = useSession();
  const navigate = useNavigate();
  const navBtn = "block w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10";
  return (
    <div className="min-h-full grid grid-cols-[220px_1fr]">
      <aside className="border-r border-white/10 p-4 space-y-1">
        <div className="font-black tracking-tight mb-4">
          Water<span style={{ color: "var(--wpx-accent)" }}>ProofX</span>
          <div className="text-[11px] text-white/40 font-normal uppercase tracking-wider">{title}</div>
        </div>
        {nav.map((n) =>
          n.key && onSelect ? (
            <button
              key={n.key}
              onClick={() => onSelect(n.key!)}
              aria-current={activeKey === n.key ? "page" : undefined}
              className={`${navBtn} ${activeKey === n.key ? "bg-blue-500/20 text-white" : ""}`}
            >
              {n.label}
            </button>
          ) : (
            <Link
              key={n.to + n.label}
              to={n.to}
              className="block px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 [&.active]:bg-blue-500/20 [&.active]:text-white"
            >
              {n.label}
            </Link>
          ),
        )}
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
          className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/10 w-full"
        >
          <LogOut size={15} /> Sign out
        </button>
      </aside>
      <main className="p-8">
        {(() => {
          const role = me?.session?.role;
          const meta = role ? ROLE_META[role] : null;
          const display = me?.user?.name || me?.user?.email || "there";
          return (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div>
                <h2 className="text-xl font-black tracking-tight">Welcome back, {display}</h2>
                <p className="text-sm text-white/45">{meta?.surface ?? "Dashboard"}</p>
              </div>
              {meta && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ${meta.badge}`}>
                  {meta.label}
                </span>
              )}
            </div>
          );
        })()}
        {children}
      </main>
    </div>
  );
}

export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-white/50 text-sm mt-1">{note}</p>
    </div>
  );
}
