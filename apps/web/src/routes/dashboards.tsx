// Role dashboard shells. Rich content (leads, jobs, MasterReport, config) lands
// in Phases 4–8; these establish the role-scoped surfaces + navigation now.
import { useState } from "react";
import { DashboardShell, type NavItem } from "../components/DashboardShell";
import { LeadsBoard } from "./LeadsBoard";
import { MyRequests } from "./MyRequests";
import { PricingConfigEditor } from "./PricingConfig";
import { CrewBoard } from "./CrewBoard";
import { ScheduleBoard } from "./ScheduleBoard";

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
      <h1 className="text-2xl font-black mb-1">My site visits</h1>
      <p className="mb-6 text-sm text-white/45">Your assigned inspections. Confirm, start, and close out each visit.</p>
      <CrewBoard />
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
  const [tab, setTab] = useState<"leads" | "schedule">("leads");
  return (
    <DashboardShell title="Admin" nav={adminNav}>
      <div className="mb-6 flex items-center gap-2">
        {(["leads", "schedule"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${
              tab === t ? "bg-blue-500 text-white" : "border border-white/10 text-white/55 hover:bg-white/5"
            }`}
          >
            {t === "leads" ? "Lead pipeline" : "Site visits"}
          </button>
        ))}
      </div>
      {tab === "leads" ? <LeadsBoard /> : <ScheduleBoard />}
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
