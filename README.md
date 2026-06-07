# WaterProofX Super-App

Multi-tenant waterproofing lead-gen platform: website + webapp + CRM + CMS.
See `../MASTER_BUILD_SPEC.md` and `../PRD.md` for full design.

## Stack
- **apps/marketing** — Astro static (SEO/AEO) + React islands *(scaffold pending)*
- **apps/web** — React SPA (Vite + TanStack Router), tools + dashboards *(scaffold pending)*
- **apps/api** — Node (Hono) REST API — auth, OTP, AI, geocode, CRUD
- **packages/core** — unified pricing/BOQ engine + scoring + brands (tested)
- **packages/db** — Drizzle ORM + MySQL schema (multi-tenant, app-layer isolation)
- **packages/types** — shared domain types

## Status (built so far)
- ✅ Monorepo + npm workspaces
- ✅ `@wpx/core` pricing engine — Tier-0 range + Tier-1 tiered estimate, config-driven, 5/5 tests pass
- ✅ `@wpx/db` — 30-table MySQL schema, scoped-isolation layer, migration `drizzle/0000_*.sql`, seed
- ✅ `@wpx/api` — Hono server, `/health` + `/api/pricing/{quick,exact}` live
- ⬜ web + marketing apps, auth/OTP, photo AI, CRM, lifecycle, super-admin config (Phases 3–9)

## Run
```bash
npm install
npm run test -w @wpx/core        # core engine tests
npm run db:generate              # regenerate migration from schema
# set DATABASE_URL in .env, then:
npm run db:migrate && npm run db:seed
npm run dev:api                  # http://localhost:8787
```

## Smoke test
```bash
curl -XPOST localhost:8787/api/pricing/quick  -d '{"service":"terrace","area":1200,"severity":"severe"}'
curl -XPOST localhost:8787/api/pricing/exact  -d '{"service":"bathroom","area":60}'
```

## Notes
- MySQL has no RLS → tenant/client isolation enforced via `packages/db/src/scoped.ts`. Never bypass it.
- Finalized quotes/jobs/warranties freeze a price snapshot (court-proof); only drafts/live calc use current config.
- Node ≥20 (Hostinger target).
