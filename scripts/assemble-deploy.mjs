// Assembles a single static publish dir for Hostinger git deploy.
//   deploy/        ← marketing (Astro static) at web root
//   deploy/app/    ← web SPA (Vite static) under /app  (+ SPA fallback .htaccess)
// Run AFTER both apps are built (see root "build:deploy" script).
import { rmSync, mkdirSync, cpSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => resolve(root, ...s);

const marketingDist = p("apps/marketing/dist");
const webDist = p("apps/web/dist");
const out = p("deploy");

for (const d of [marketingDist, webDist]) {
  if (!existsSync(d)) {
    console.error(`[assemble] missing build output: ${d} — run the app build first`);
    process.exit(1);
  }
}

rmSync(out, { recursive: true, force: true });
cpSync(marketingDist, out, { recursive: true });
mkdirSync(p("deploy/app"), { recursive: true });
cpSync(webDist, p("deploy/app"), { recursive: true });

// SPA deep-link fallback for Apache (Hostinger). /app/* → /app/index.html
const htaccess = `Options -MultiViews
RewriteEngine On
RewriteBase /app/
RewriteRule ^index\\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /app/index.html [L]
`;
writeFileSync(p("deploy/app/.htaccess"), htaccess);

console.log("[assemble] deploy/ ready — marketing at root, SPA at /app");
