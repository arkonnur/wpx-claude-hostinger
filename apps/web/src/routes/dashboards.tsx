// Role dashboard shells. Rich content (leads, jobs, MasterReport, config) lands
// in Phases 4–8; these establish the role-scoped surfaces + navigation now.
import { useState } from "react";
import { DashboardShell, type NavItem } from "../components/DashboardShell";
import { LeadsBoard } from "./LeadsBoard";
import { MyRequests } from "./MyRequests";
import { PricingConfigEditor } from "./PricingConfig";
import { ProductsConfigEditor } from "./ProductsConfig";
import { ToolsConfigEditor } from "./ToolsConfig";
import { OwnerOverview, TenantSettings, BillingPanel } from "./OwnerPanels";
import { CrewBoard } from "./CrewBoard";
import { ScheduleBoard } from "./ScheduleBoard";
import { JobsBoard } from "./JobsBoard";
import { QuotesBoard } from "./QuotesBoard";

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
      <h2 className="mb-4 mt-10 text-xl font-black">Your quotes</h2>
      <QuotesBoard scope="mine" />
    </DashboardShell>
  );
}

const crewNav: NavItem[] = [
  { to: "/crew", label: "My visits" },
  { to: "/crew", label: "Inspections" },
  { to: "/crew", label: "Jobs" },
];
export function EmployeeDashboard() {
  const [tab, setTab] = useState<"visits" | "jobs">("visits");
  return (
    <DashboardShell title="Field crew" nav={crewNav}>
      <div className="mb-6 flex items-center gap-2">
        {(["visits", "jobs"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${tab === t ? "bg-blue-500 text-white" : "border border-white/10 text-white/55 hover:bg-white/5"}`}>
            {t === "visits" ? "Site visits" : "Jobs"}
          </button>
        ))}
      </div>
      {tab === "visits" ? <CrewBoard /> : <JobsBoard scope="mine" />}
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
  const [tab, setTab] = useState<"leads" | "schedule" | "quotes" | "jobs">("leads");
  const label: Record<string, string> = { leads: "Lead pipeline", schedule: "Site visits", quotes: "Quotes", jobs: "Jobs" };
  return (
    <DashboardShell title="Admin" nav={adminNav}>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["leads", "schedule", "quotes", "jobs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              tab === t ? "bg-blue-500 text-white" : "border border-white/10 text-white/55 hover:bg-white/5"
            }`}
          >
            {label[t]}
          </button>
        ))}
      </div>
      {tab === "leads" ? <LeadsBoard /> : tab === "schedule" ? <ScheduleBoard /> : tab === "quotes" ? <QuotesBoard scope="all" /> : <JobsBoard scope="all" />}
    </DashboardShell>
  );
}

type OwnerTab = "overview" | "tenants" | "catalog" | "tools" | "billing";
const ownerNav: NavItem[] = [
  { to: "/owner", key: "overview", label: "Overview" },
  { to: "/owner", key: "tenants", label: "Tenants" },
  { to: "/owner", key: "catalog", label: "Pricing & products" },
  { to: "/owner", key: "tools", label: "Tools config" },
  { to: "/owner", key: "billing", label: "Billing" },
];
const OWNER_BLURB: Record<OwnerTab, string> = {
  overview: "Live business KPIs across leads, jobs, quotes and warranties.",
  tenants: "Your organisation profile and branding.",
  catalog: "Pricing rates and the product/brand catalog — live on every calculator and quote within ~30s.",
  tools: "Show, hide, reorder and gate the public tools. Live on the tool hub within ~30s.",
  billing: "Plan, usage and limits.",
};
export function OwnerDashboard() {
  const [tab, setTab] = useState<OwnerTab>("overview");
  return (
    <DashboardShell title="Owner" nav={ownerNav} activeKey={tab} onSelect={(k) => setTab(k as OwnerTab)}>
      <p className="mb-6 text-sm text-white/45">{OWNER_BLURB[tab]}</p>
      {tab === "overview" && <OwnerOverview />}
      {tab === "tenants" && <TenantSettings />}
      {tab === "catalog" && (
        <div className="space-y-12">
          <section>
            <h3 className="mb-4 text-lg font-black">Dynamic pricing</h3>
            <PricingConfigEditor />
          </section>
          <section>
            <h3 className="mb-4 text-lg font-black">Products &amp; brands</h3>
            <ProductsConfigEditor />
          </section>
        </div>
      )}
      {tab === "tools" && <ToolsConfigEditor />}
      {tab === "billing" && <BillingPanel />}
    </DashboardShell>
  );
}
