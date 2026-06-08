import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  Link,
  Navigate,
} from "@tanstack/react-router";
import "./styles.css";
import type { Role } from "@wpx/types";
import { SessionProvider, useSession } from "./lib/session";
import { AuthUIProvider, useAuthUI } from "./lib/authui";
import { RoleGuard, roleHome, ROLE_META, STAFF_ROLES } from "./components/RoleGuard";
import { ClientDashboard, EmployeeDashboard, AdminDashboard, OwnerDashboard } from "./routes/dashboards";
import { ToolHub } from "./tools/ToolHub";
import { QuickCalculator } from "./tools/QuickCalculator";
import { PhotoDiagnose } from "./tools/PhotoDiagnose";
import { BookVisit } from "./tools/BookVisit";
import { WarrantyLookup } from "./tools/WarrantyLookup";
import { HealthReport } from "./tools/HealthReport";
import { ToolShell } from "./tools/ToolShell";

function HeaderAuth() {
  const { role, name, loading } = useSession();
  const { open } = useAuthUI();
  if (loading) return null;
  if (!role) return <button onClick={open} className="hover:text-white">Sign in</button>;
  const meta = ROLE_META[role];
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-white/50 sm:inline">{name || "Account"}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${meta.badge}`}>
        {meta.label}
      </span>
      <Link to={roleHome(role)} className="font-semibold text-white hover:text-white">Dashboard</Link>
    </div>
  );
}

// Index landing: staff (owner/admin/employee) go straight to their dashboard;
// customers/visitors see the public tool hub.
function IndexLanding() {
  const { role, loading } = useSession();
  if (loading) return <div className="p-8 text-white/50">Loading…</div>;
  if (role && STAFF_ROLES.includes(role)) return <Navigate to={roleHome(role)} />;
  return <ToolHub />;
}

const rootRoute = createRootRoute({
  component: () => (
    <SessionProvider>
      <AuthUIProvider>
        <div className="min-h-full">
          <header className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
            <a href="/" className="text-lg font-black tracking-tight">
              Water<span style={{ color: "var(--wpx-accent)" }}>ProofX</span>
            </a>
            <nav className="ml-auto flex gap-4 text-sm text-white/60">
              <Link to="/" className="hover:text-white">Tools</Link>
              <HeaderAuth />
            </nav>
          </header>
          <Outlet />
        </div>
      </AuthUIProvider>
    </SessionProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexLanding,
});

const tool = (path: string, Comp: () => ReactNode) =>
  createRoute({ getParentRoute: () => rootRoute, path, component: Comp });

const calculatorRoute = tool("/calculator", () => (
  <ToolShell
    title="Instant Cost Calculator"
    subtitle="A transparent Bangalore price band in seconds — no sign-up."
    gate="Free"
  >
    <QuickCalculator />
  </ToolShell>
));

const estimateRoute = tool("/estimate", () => (
  <ToolShell
    title="Exact Tiered Estimate"
    subtitle="Basic / medium / premium pricing with GST, brands and coverage."
    gate="OTP once"
  >
    <QuickCalculator />
  </ToolShell>
));

const diagnoseRoute = tool("/diagnose", PhotoDiagnose);
const bookRoute = tool("/book", BookVisit);
const warrantyRoute = tool("/warranty", WarrantyLookup);
const reportRoute = tool("/report", HealthReport);

const guarded = (path: string, allow: Role[], Comp: () => ReactNode) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: () => <RoleGuard allow={allow}>{<Comp />}</RoleGuard>,
  });

const portalRoute = guarded("/portal", ["client"], ClientDashboard);
const crewRoute = guarded("/crew", ["employee"], EmployeeDashboard);
const adminRoute = guarded("/admin", ["admin", "owner"], AdminDashboard);
const ownerRoute = guarded("/owner", ["owner"], OwnerDashboard);

const router = createRouter({
  basepath: "/app",
  routeTree: rootRoute.addChildren([
    indexRoute,
    calculatorRoute,
    estimateRoute,
    diagnoseRoute,
    bookRoute,
    warrantyRoute,
    reportRoute,
    portalRoute,
    crewRoute,
    adminRoute,
    ownerRoute,
  ]),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
