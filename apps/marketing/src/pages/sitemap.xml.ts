import type { APIRoute } from "astro";
import { SITE } from "../data/site";
import { SERVICES_DETAIL } from "../data/landing";

// Static sitemap — home + per-service pages. Regenerated at build.
export const GET: APIRoute = () => {
  const urls = [
    { loc: `${SITE}/`, priority: "1.0", changefreq: "weekly" },
    ...SERVICES_DETAIL.map((s) => ({
      loc: `${SITE}/services/${s.slug}`,
      priority: "0.8",
      changefreq: "monthly",
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
  .join("\n")}
</urlset>
`;

  return new Response(body, { headers: { "Content-Type": "application/xml" } });
};
