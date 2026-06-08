// Single source for canonical site identity + reusable structured data.
// Keep the domain consistent everywhere (canonical, OG, robots, sitemap, JSON-LD).
import { BRAND } from "./landing";

export const SITE = "https://waterproofx.in";
export const SITE_NAME = "WaterProofX";
export const LOCALE = "en_IN";
export const OG_IMAGE = `${SITE}/og.jpg`; // 1200×630 social card (drop the asset in public/)

const POSTAL = {
  "@type": "PostalAddress",
  streetAddress: "100ft Road, Indiranagar",
  addressLocality: "Bengaluru",
  addressRegion: "KA",
  postalCode: "560038",
  addressCountry: "IN",
};

/** Organization — global brand identity, reused on every page. */
export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: SITE_NAME,
  url: SITE,
  email: BRAND.email,
  telephone: BRAND.phone,
  logo: `${SITE}/favicon.svg`,
  address: POSTAL,
  sameAs: [`https://wa.me/${BRAND.whatsapp}`],
};

/** WebSite — enables sitelinks + (future) search box in SERP. */
export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  name: SITE_NAME,
  url: SITE,
  publisher: { "@id": `${SITE}/#organization` },
  inLanguage: "en-IN",
};

/** BreadcrumbList builder for inner pages (AEO + SERP breadcrumbs). */
export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE}${t.path}`,
    })),
  };
}
