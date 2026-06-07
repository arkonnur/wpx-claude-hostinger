import { type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useSession } from "../lib/session";

export interface NavItem {
  to: string;
  label: string;
}

export function DashboardShell({ title, nav, children }: { title: string; nav: NavItem[]; children: ReactNode }) {
  const { me, signOut } = useSession();
  const navigate = useNavigate();
  return (
    <div className="min-h-full grid grid-cols-[220px_1fr]">
      <aside className="border-r border-white/10 p-4 space-y-1">
        <div className="font-black tracking-tight mb-4">
          Water<span style={{ color: "var(--wpx-accent)" }}>ProofX</span>
          <div className="text-[11px] text-white/40 font-normal uppercase tracking-wider">{title}</div>
        </div>
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="block px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 [&.active]:bg-blue-500/20 [&.active]:text-white"
          >
            {n.label}
          </Link>
        ))}
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
        <div className="text-xs text-white/40 mb-4">{me?.session?.role} · {me?.session?.userId?.slice(0, 8)}</div>
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
