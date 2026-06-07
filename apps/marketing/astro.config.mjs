import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Static output → deploys to Hostinger (Apache) behind Cloudflare. Best SEO/AEO + speed.
export default defineConfig({
  output: "static",
  site: "https://waterproofx.com",
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
