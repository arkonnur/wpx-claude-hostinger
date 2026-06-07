import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { pricingRoutes } from "./routes/pricing";
import { authRoutes } from "./auth/routes";

const app = new Hono();

app.use("*", cors({ origin: (process.env.APP_URL ?? "http://localhost:5173"), credentials: true }));

app.get("/health", (c) => c.json({ ok: true, service: "wpx-api", ts: Date.now() }));

app.route("/api/auth", authRoutes);
app.route("/api/pricing", pricingRoutes);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[wpx-api] listening on http://localhost:${info.port}`);
});

export { app };
