// Role dashboard shells. Rich content (leads, jobs, MasterReport, config) lands
// in Phases 4–8; these establish the role-scoped surfaces + navigation now.
import { DashboardShell, Placeholder, type NavItem } from "../components/DashboardShell";
import { LeadsBoard } from "./LeadsBoard";
import { MyRequests } from "./MyRequests";
import { PricingConfigEditor } from "./PricingConfig";

const clientNav: NavItem[] = [
  { to: "/portal", label: "Overview" },
  { to: "/portal", label: "My reports" },
  { to: "/portal", label: "Quotes" },
  { to: "/portal", label: "Warranty" },
];
export function ClientDashboard() {
  return (
    <DashboardShell title="My account" nav={clientNav}>
      <h1 className="text-2xl font-black mb-6">Your requests & activity</h1>
      <MyRequests />
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
      <h1 className="text-2xl font-black mb-6">Lead pipeline</h1>
      <LeadsBoard />
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
      <h1 className="text-2xl font-black mb-2">Dynamic pricing</h1>
      <p className="mb-6 text-sm text-white/45">Edit rates — they go live on every calculator within ~30s.</p>
      <PricingConfigEditor />
    </DashboardShell>
  );
}
