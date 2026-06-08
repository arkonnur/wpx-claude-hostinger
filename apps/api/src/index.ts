import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { pricingRoutes } from "./routes/pricing";
import { authRoutes } from "./auth/routes";
import { leadRoutes } from "./routes/leads";
import { eventRoutes } from "./routes/events";
import { diagnoseRoutes } from "./routes/diagnose";
import { configRoutes } from "./routes/config";
import { appointmentRoutes } from "./routes/appointments";
import { inspectionRoutes } from "./routes/inspections";
import { jobRoutes } from "./routes/jobs";
import { warrantyRoutes } from "./routes/warranty";
import { productRoutes } from "./routes/products";
import { quoteRoutes } from "./routes/quotes";

// Fail closed in production: never run with a missing/weak signing secret or
// an unset app origin (CORS would otherwise fall back to localhost).
if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set (>=32 chars) in production");
  }
  if (!process.env.APP_URL) {
    throw new Error("APP_URL must be set in production");
  }
}

const app = new Hono();

const allowedOrigins = (process.env.APP_URL ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""));
app.use(
  "*",
  cors({
    origin: (origin) => (allowedOrigins.includes(origin.replace(/\/$/, "")) ? origin : allowedOrigins[0]),
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "wpx-api", ts: Date.now() }));

app.route("/api/auth", authRoutes);
app.route("/api/pricing", pricingRoutes);
app.route("/api/leads", leadRoutes);
app.route("/api/events", eventRoutes);
app.route("/api/diagnose", diagnoseRoutes);
app.route("/api/config", configRoutes);
app.route("/api/appointments", appointmentRoutes);
app.route("/api/inspections", inspectionRoutes);
app.route("/api/jobs", jobRoutes);
app.route("/api/warranty", warrantyRoutes);
app.route("/api/products", productRoutes);
app.route("/api/quotes", quoteRoutes);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[wpx-api] listening on http://localhost:${info.port}`);
});

export { app };
