// Role dashboard shells. Rich content (leads, jobs, MasterReport, config) lands
// in Phases 4–8; these establish the role-scoped surfaces + navigation now.
import { DashboardShell, Placeholder, type NavItem } from "../components/DashboardShell";

const clientNav: NavItem[] = [
  { to: "/portal", label: "Overview" },
  { to: "/portal", label: "My reports" },
  { to: "/portal", label: "Quotes" },
  { to: "/portal", label: "Warranty" },
];
export function ClientDashboard() {
  return (
    <DashboardShell title="My account" nav={clientNav}>
      <h1 className="text-2xl font-black mb-6">Your building health</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Placeholder title="Building Health Score" note="Use the tools to build your score (Phase 4)." />
        <Placeholder title="MasterReport" note="Your combined report — fills as you use tools." />
        <Placeholder title="Quotes" note="Estimates & quotes you receive (Phase 4)." />
        <Placeholder title="Warranty card" note="Issued after job completion (Phase 7)." />
      </div>
    </DashboardShell>
  );
}

const crewNav: NavItem[] = [
  { to: "/crew", label: "My visits" },
  { to: "/crew", label: "Inspections" },
  { to: "/crew", label: "Jobs" },
];
export function EmployeeDashboard() {
  return (
    <DashboardShell title="Field crew" nav={crewNav}>
      <h1 className="text-2xl font-black mb-6">Assigned work</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Placeholder title="Today's site visits" note="Assigned pre-inspections (Phase 7)." />
        <Placeholder title="Execution checklists" note="Corner-by-corner with photos (Phase 7)." />
      </div>
    </DashboardShell>
  );
}

const adminNav: NavItem[] = [
  { to: "/admin", label: "Pipeline" },
  { to: "/admin", label: "Leads" },
  { to: "/admin", label: "Contacts" },
  { to: "/admin", label: "Inspections" },
  { to: "/admin", label: "Jobs" },
  { to: "/admin", label: "Quotes" },
  { to: "/admin", label: "Settings" },
];
export function AdminDashboard() {
  return (
    <DashboardShell title="Admin" nav={adminNav}>
      <h1 className="text-2xl font-black mb-6">Operations</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Placeholder title="Lead pipeline" note="Kanban + scoring (Phase 6)." />
        <Placeholder title="Client-360" note="Every client's full activity (Phase 6)." />
        <Placeholder title="Quotes & jobs" note="Quote builder + job lifecycle (Phase 4/7)." />
      </div>
    </DashboardShell>
  );
}

const ownerNav: NavItem[] = [
  { to: "/owner", label: "Overview" },
  { to: "/owner", label: "Tenants" },
  { to: "/owner", label: "Pricing & products" },
  { to: "/owner", label: "Tools config" },
  { to: "/owner", label: "Billing" },
];
export function OwnerDashboard() {
  return (
    <DashboardShell title="Owner" nav={ownerNav}>
      <h1 className="text-2xl font-black mb-6">Platform</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Placeholder title="Tenants" note="Cross-tenant management (Phase 8)." />
        <Placeholder title="Dynamic pricing & products" note="Edit all rates/products — reflects everywhere (Phase 8)." />
        <Placeholder title="Tools config" note="Gate/access per tool, AI-verified (Phase 8)." />
      </div>
    </DashboardShell>
  );
}
