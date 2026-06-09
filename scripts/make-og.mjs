// Generates the 1200×630 social card → apps/marketing/public/og.jpg
// Run: node scripts/make-og.mjs   (sharp ships with the Astro toolchain)
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const out = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/marketing/public/og.jpg",
);

const chip = (x, label) => `
  <g transform="translate(${x},470)">
    <rect width="${28 + label.length * 11}" height="48" rx="24" fill="#0a1228" stroke="#1e3a8a" stroke-width="1.5"/>
    <text x="${(28 + label.length * 11) / 2}" y="31" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#bfdbfe" text-anchor="middle">${label}</text>
  </g>`;

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#020617"/>
      <stop offset="0.55" stop-color="#0a1228"/>
      <stop offset="1" stop-color="#03102e"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="0.15" r="0.6">
      <stop offset="0" stop-color="#002bfa" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#002bfa" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#002bfa"/>

  <text x="80" y="150" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="6" fill="#60a5fa">AI-ENGINEERED WATERPROOFING</text>

  <text x="76" y="285" font-family="Arial, sans-serif" font-size="118" font-weight="800" fill="#ffffff">Water<tspan fill="#3b82f6">ProofX</tspan></text>

  <text x="80" y="360" font-family="Arial, sans-serif" font-size="40" font-weight="500" fill="#cbd5e1">Bangalore's first AI photo-diagnosis + engineered</text>
  <text x="80" y="412" font-family="Arial, sans-serif" font-size="40" font-weight="500" fill="#cbd5e1">leak repair — with court-proof frozen quotes.</text>

  ${chip(80, "★ 4.9 / 5")}
  ${chip(230, "10-yr warranty")}
  ${chip(470, "AI photo diagnosis")}
  ${chip(760, "Lowest-price guarantee")}

  <text x="1120" y="150" font-family="Arial, sans-serif" font-size="26" font-weight="600" fill="#64748b" text-anchor="end">waterproofx.in</text>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(out);
console.log(`[og] wrote ${out}`);
