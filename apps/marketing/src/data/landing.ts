// Landing content — ported from the waterproofx-google-studio prototype (data.ts).
// Single source for all landing islands so design + copy stay consistent.

export const BRAND = {
  name: "WaterProofX",
  tagline: "India's 1st AI Powered and Engineered Waterproofing Services",
  slogan: "Seal the unseen.",
  positioning: "Engineered. Not guesswork.",
  primary: "#002bfa",
  accent: "#3b82f6",
  darkBg: "#020617",
  card: "#0b1530",
  phone: "+91 80000 12345",
  phoneRaw: "918000012345",
  whatsapp: "918000012345",
  email: "hello@waterproofx.in",
  address: "100ft Road, Indiranagar, Bengaluru, Karnataka 560038",
  city: "Bangalore",
  rating: "4.9",
  reviewCount: "247",
  warranty: "10-Year",
};

export interface Layer {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  thickness: string;
  color: string;
  benefits: string[];
}

export const LAYERS: Layer[] = [
  {
    id: "layer-1",
    name: "Armour-Shield Aliphatic Shield",
    scientificName: "UV-Refracting Aliphatic Polyurethane",
    description:
      "Exterior armour reflecting up to 94% of solar heat, resisting abrasion, ozone, pooling water and acid rain — protecting the waterproof barrier beneath.",
    thickness: "0.8 mm",
    color: "#60a5fa",
    benefits: ["94% solar heat reflectance", "No elasticity loss at -30°C", "Heavy-traffic certified", "Full UV blockade"],
  },
  {
    id: "layer-2",
    name: "Glass-Fibre Matrix Core",
    scientificName: "High-Tensile Quad-Axial Reinforcement Mesh",
    description:
      "Multi-axial glass-fibre lattice distributing shear stress, bridging dynamic structural cracks up to 4.5mm without rupture.",
    thickness: "1.2 mm",
    color: "#22d3ee",
    benefits: ["Crack bridging to 4.5mm", "Tensile > 1400 N/50mm", "Rot-proof", "Shear-stress dissipation"],
  },
  {
    id: "layer-3",
    name: "Elastomeric Poly-X Membrane",
    scientificName: "Liquid-Applied Seamless Hydrophobic Co-Polymer",
    description:
      "Seamless 400% self-healing elastomeric layer that cures into a continuous rubberised glove — zero joints, seams or lap weaknesses.",
    thickness: "2.4 mm",
    color: "#2563eb",
    benefits: ["400% elongation", "100% seamless finish", "Zero vapour transmission", "Root & acid resistant"],
  },
  {
    id: "layer-4",
    name: "Crystal-X Capillary Primer",
    scientificName: "Moisture-Reactive Crystallizing Primer",
    description:
      "Deep-infusion primer penetrating up to 65mm into concrete capillaries, growing crystalline fibres in the pores to block moisture from within.",
    thickness: "Deep penetration",
    color: "#2dd4bf",
    benefits: ["65mm penetration", "Self-healing in pores", "Locks sub-soil vapour", "Strengthens concrete"],
  },
  {
    id: "layer-5",
    name: "Prepared Concrete Substrate",
    scientificName: "Abrasive-Blasted Concrete Base",
    description:
      "Shot-blasted base achieving an ICRI CSP-3 profile for unmatched chemical and mechanical anchoring of the polymer system.",
    thickness: "Structural",
    color: "#64748b",
    benefits: ["CSP-3 anchor profile", "Moisture below 4%", "Voids repaired", "Monolithic integrity"],
  },
];

export interface RiskArea {
  id: string;
  name: string;
  description: string;
  vulnerabilityMsg: string;
  riskFactor: number;
  solutions: string[];
  baseSftPrice: number;
}

export const RISK_AREAS: RiskArea[] = [
  { id: "area-roof", name: "Roofs & Terraces", description: "Exposed to thermal cycles, expansion cracks, heavy rain load and pooling.", vulnerabilityMsg: "Thermal cycling widens screed joints; moisture rusts rebar and carbonates concrete.", riskFactor: 9, solutions: ["Seamless Poly-X system", "UV-reflective shield", "Dual-axial fibre lattice"], baseSftPrice: 125 },
  { id: "area-basement", name: "Basements & Retaining Walls", description: "Persistent hydrostatic pressure from sub-soil water tables.", vulnerabilityMsg: "Sub-soil dampness leaks through walls, breeds mould, corrodes footings.", riskFactor: 10, solutions: ["Crystal-X hydrophobic treatment", "Dual-coat slurry", "Drain matrix"], baseSftPrice: 165 },
  { id: "area-bathroom", name: "Sunken Bathrooms & Wet Areas", description: "Flooded zones, chemical washes, drainage joints and pipe penetrations.", vulnerabilityMsg: "Pipe collars and joints leak behind cladding, bubbling paint and rotting wood.", riskFactor: 8, solutions: ["PU under-tile coating", "Liquid pipe-collar detailing", "Fibre-reinforced grout base"], baseSftPrice: 95 },
  { id: "area-water-tank", name: "Water Tanks & Pools", description: "Sustained positive-side water load needing food-grade safety.", vulnerabilityMsg: "Hydraulic friction tears standard paints; water escapes behind tiles.", riskFactor: 9, solutions: ["Food-grade co-polymer", "Non-toxic hydrophobic plaster", "Crystallization seal"], baseSftPrice: 145 },
  { id: "area-facade", name: "External Facades & Podiums", description: "Beaten by wind-driven rain, joint movement and tremors.", vulnerabilityMsg: "Wall cracks let water under plaster, causing indoor dampness and black mould.", riskFactor: 7, solutions: ["Anti-carbonation system", "Expansion-joint seals", "Water-repellent coating"], baseSftPrice: 85 },
];

export interface Slide {
  id: string;
  phase: string;
  title: string;
  highlight: string;
  subtitle: string;
  description: string;
  metric: string;
  metricLabel: string;
}

export const SLIDES: Slide[] = [
  { id: "s0", phase: "01 / THE SILENT MENACE", title: "Water is the ultimate", highlight: "Sovereign Destroyer", subtitle: "A molecular threat to structural eternity.", description: "Over 90% of structural building damage starts with water — capillary suction and hydrostatic pressure drive molecules into concrete, rusting steel and fracturing foundations.", metric: "90%", metricLabel: "Of failures linked to water ingress" },
  { id: "s1", phase: "02 / THE FAILURE METRIC", title: "Standard barriers only", highlight: "Postpone Disaster", subtitle: "Seams break, joints tear, tar sheets rot.", description: "Conventional rolls fail at overlap joints after ~18 months of thermal stress. Brittle segments snap on night cooling, letting moisture rot structures from inside.", metric: "1.5 Yrs", metricLabel: "Average failure horizon of conventional coatings" },
  { id: "s2", phase: "03 / THE ABSOLUTE ANSWER", title: "WaterProofX builds the", highlight: "Indestructible Core", subtitle: "Seamless. Monolithic. Molecular curing.", description: "Crystal-X reactive primer plus a fluid-applied Poly-X elastomeric membrane encapsulate your structure in a seamless hydrophobic vault that expands and self-heals.", metric: "0.00", metricLabel: "Permeability — complete impervious isolation" },
];

export interface Showcase {
  id: string;
  title: string;
  location: string;
  category: string;
  scope: string;
  beforeImg: string;
  afterImg: string;
  stats: { label: string; value: string }[];
  highlightMsg: string;
}

export const SHOWCASES: Showcase[] = [
  { id: "p1", title: "Signature Residency Terraces", location: "MG Road, Bengaluru", category: "Roof & Podiums", scope: "12,500 sq.ft dynamic decking", beforeImg: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop", afterImg: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop", stats: [{ label: "Vapour resistance", value: "100%" }, { label: "Thermal trim", value: "-12%" }, { label: "Joints", value: "Seam-free" }], highlightMsg: "Skylights, planters and pedestrian areas waterproofed seamlessly." },
  { id: "p2", title: "CyberCity Sub-Grade Hub", location: "Gurugram", category: "Basements", scope: "48,000 sq.ft triple basement", beforeImg: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop", afterImg: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?q=80&w=800&auto=format&fit=crop", stats: [{ label: "Hydrostatic head", value: "32 m" }, { label: "Seepage", value: "0.0 ml" }, { label: "Re-hardening", value: "+18%" }], highlightMsg: "Defeated high subsoil pressure, reclaiming dry corporate space." },
];

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
  { id: "t1", author: "Ramesh K.", role: "Whitefield", company: "Bangalore", quote: "Our terrace had been leaking for two monsoons. WaterProofX fixed it in two days and it's been completely dry since. Professional team and fair pricing.", rating: 5 },
  { id: "t2", author: "Priya S.", role: "HSR Layout", company: "Bangalore", quote: "Bathroom seepage was ruining the bedroom wall. They sealed it without breaking a single tile. Highly recommend the inspection — totally free and honest.", rating: 5 },
  { id: "t3", author: "Arjun M.", role: "Koramangala", company: "Bangalore", quote: "Got quotes from 4 companies. WaterProofX explained the actual problem instead of overselling. 10-year warranty sealed the deal.", rating: 5 },
  { id: "t4", author: "Deepa R.", role: "Sarjapur Road", company: "Bangalore", quote: "Basement of our villa used to flood. Their crystalline + injection treatment worked perfectly. Clean, on-time and very knowledgeable.", rating: 5 },
  { id: "t5", author: "Vikram N.", role: "Indiranagar", company: "Bangalore", quote: "Exterior facade coating transformed our old building. No more damp patches inside. Worth every rupee.", rating: 5 },
  { id: "t6", author: "Sneha P.", role: "JP Nagar", company: "Bangalore", quote: "Water tank waterproofing done with food-safe coating. Great communication on WhatsApp throughout. Will use again.", rating: 5 },
];

export const PROCESS_STEPS = [
  { id: 1, title: "Engineering Inspection", desc: "On-site moisture mapping, slope survey, crack analysis with instruments." },
  { id: 2, title: "Surface Preparation", desc: "Shot-blast to CSP-3 profile, repair voids, dry to <4% moisture." },
  { id: 3, title: "Crystal-X Primer", desc: "Deep capillary crystallization primer infused into the slab." },
  { id: 4, title: "Poly-X Membrane", desc: "Seamless fluid-applied elastomeric membrane, fibre-reinforced." },
  { id: 5, title: "Armour Shield", desc: "UV-reflective aliphatic topcoat for heat + abrasion defence." },
  { id: 6, title: "Warranty Card", desc: "Flood-tested, QA-verified, brand-backed warranty issued." },
];

export const SERVICES = [
  { id: "terrace", label: "Terrace & Roof", from: 55 },
  { id: "bathroom", label: "Bathroom & Wet Area", from: 90 },
  { id: "basement", label: "Basement", from: 130 },
  { id: "tank", label: "Water Tank", from: 110 },
  { id: "wall", label: "Wall Dampness", from: 45 },
  { id: "facade", label: "Exterior Facade", from: 58 },
];

// ── Tool-navigation cards (placed directly below hero) ──────────────────
// `gate` mirrors the lead-ladder: public = no OTP, otp = WhatsApp-verify once,
// account = email login. `href` deep-links into the React SPA (/app).
export interface ToolCard {
  id: string;
  title: string;
  desc: string;
  icon: string; // lucide-react icon name
  href: string;
  gate: "Free" | "OTP once" | "Account";
  badge?: string;
  featured?: boolean;
}

export const TOOLS: ToolCard[] = [
  {
    id: "photo-ai",
    title: "AI Photo Diagnosis",
    desc: "Upload a photo of your dampness, terrace or leak — get an instant AI condition report.",
    icon: "ScanLine",
    href: "/app/diagnose",
    gate: "OTP once",
    badge: "Most popular",
    featured: true,
  },
  {
    id: "calculator",
    title: "Instant Cost Calculator",
    desc: "Enter area + surface, get a transparent Bangalore price range in seconds. No sign-up.",
    icon: "Calculator",
    href: "/app/calculator",
    gate: "Free",
  },
  {
    id: "estimate",
    title: "Exact Tiered Estimate",
    desc: "Basic / medium / premium pricing with GST, brands and coverage breakdown.",
    icon: "ReceiptIndianRupee",
    href: "/app/estimate",
    gate: "OTP once",
  },
  {
    id: "inspection",
    title: "Free Site Inspection",
    desc: "Book a free on-site engineering inspection — moisture mapping, slope & crack survey.",
    icon: "ClipboardCheck",
    href: "/app/book",
    gate: "Free",
  },
  {
    id: "warranty",
    title: "Warranty Check",
    desc: "Verify your WaterProofX warranty card and service history by number.",
    icon: "ShieldCheck",
    href: "/app/warranty",
    gate: "Free",
  },
  {
    id: "health",
    title: "Building Health Report",
    desc: "Combine every tool into one AI-powered building health score and master report.",
    icon: "Activity",
    href: "/app/report",
    gate: "Account",
  },
];

// ── Detailed services (6 surfaces, matches site-data) ───────────────────
export interface ServiceDetail {
  slug: string;
  icon: string; // lucide-react icon name
  title: string;
  short: string;
  description: string;
  priceRange: string;
  bullets: string[];
}

export const SERVICES_DETAIL: ServiceDetail[] = [
  {
    slug: "terrace",
    icon: "Home",
    title: "Terrace & Roof Waterproofing",
    short: "Stop terrace & roof leakage permanently.",
    description:
      "Complete terrace and roof slab waterproofing using PU & APP membrane systems engineered for Bangalore's 970mm annual monsoon — crack bridging, slope correction and UV-stable top coats.",
    priceRange: "₹35 – ₹90 / sq ft",
    bullets: ["Surface prep & crack filling", "Polyurethane / APP membrane", "Slope correction for drainage", "UV-reflective top coat"],
  },
  {
    slug: "bathroom",
    icon: "Bath",
    title: "Bathroom Waterproofing",
    short: "Leak-proof bathrooms — without breaking tiles.",
    description:
      "Nano-injection and surface membrane waterproofing for bathrooms and wet areas. We fix seepage to walls below and adjacent rooms, often without dismantling existing tiles.",
    priceRange: "₹90 – ₹180 / sq ft",
    bullets: ["No-demolition nano grouting", "Sunken slab treatment", "Joint & corner sealing", "Anti-fungal finish"],
  },
  {
    slug: "swimming-pool",
    icon: "Waves",
    title: "Swimming Pool Waterproofing",
    short: "Crack-free, leak-proof pools that hold their water.",
    description:
      "Positive-side pool waterproofing with elastomeric and crystalline systems that withstand sustained hydraulic load, chemical washes and thermal movement — no water loss behind tiles.",
    priceRange: "₹120 – ₹220 / sq ft",
    bullets: ["Elastomeric crack-bridging coat", "Chemical & chlorine resistant", "Skimmer & inlet detailing", "Pressure leak testing"],
  },
  {
    slug: "water-tank",
    icon: "Cylinder",
    title: "Water Tank Waterproofing",
    short: "Food-safe, leak-free overhead & underground tanks.",
    description:
      "Non-toxic, potable-water-safe waterproofing for overhead, underground and sump tanks using food-grade epoxy and crystalline systems certified for drinking-water contact.",
    priceRange: "₹60 – ₹140 / sq ft",
    bullets: ["Potable-water-safe coatings", "Crack & honeycomb repair", "Food-grade epoxy lining", "Pressure leak testing"],
  },
  {
    slug: "exterior-wall",
    icon: "Layers",
    title: "Exterior Wall Waterproofing",
    short: "Protect facades from monsoon penetration.",
    description:
      "Full building-envelope protection with high-performance exterior coatings, sealant joint treatment and expansion-joint waterproofing for high-rises and independent homes.",
    priceRange: "₹30 – ₹85 / sq ft",
    bullets: ["Facade water-repellent coating", "Expansion joint sealing", "Window & sill flashing", "Anti-carbonation system"],
  },
  {
    slug: "dampness",
    icon: "PaintRoller",
    title: "Dampness Treatment & Others",
    short: "End damp walls, peeling paint & efflorescence.",
    description:
      "Interior wall dampness, rising-damp control, basement seepage and bespoke problems — crystalline treatments, elastomeric coatings and breathable systems that block water from within.",
    priceRange: "₹25 – ₹70 / sq ft",
    bullets: ["Rising-damp control", "Crystalline / PU grout injection", "Mould & salt removal", "Basement & retaining walls"],
  },
];

// ── Stats / trust band ──────────────────────────────────────────────────
export const STATS = [
  { value: "500+", label: "Projects Completed" },
  { value: "10-Yr", label: "Written Warranty" },
  { value: "4.9★", label: "247+ Reviews" },
  { value: "24–48h", label: "Free Inspection" },
];

// ── Why WaterProofX ─────────────────────────────────────────────────────
export interface WhyItem {
  icon: string;
  title: string;
  desc: string;
}

export const WHY_WPX: WhyItem[] = [
  { icon: "Brain", title: "AI-Powered Diagnostics", desc: "Our AI analyses photos and site conditions to find the root cause — not just the symptom." },
  { icon: "ShieldCheck", title: "Up to 15-Year Warranty", desc: "Brand-backed written warranty with Dr. Fixit, Fosroc, Sika & MYK Laticrete systems." },
  { icon: "BadgeCheck", title: "Genuine ISI Materials", desc: "Only authorised-distributor products — no diluted chemicals or cheap substitutes." },
  { icon: "Users", title: "Certified Applicators", desc: "Factory-trained, manufacturer-certified crews — not random daily-wage labour." },
  { icon: "IndianRupee", title: "Lowest-Price Guarantee", desc: "We match any genuine written quotation — at higher quality and a real warranty." },
  { icon: "FileCheck", title: "Engineering Inspection", desc: "Instrument-based moisture mapping, slope survey and crack analysis before we quote." },
];

// ── AI photo-diagnosis magnet ───────────────────────────────────────────
export const AI_FEATURES = [
  { icon: "Target", title: "Root-Cause Analysis", desc: "Why your previous waterproofing failed" },
  { icon: "Droplet", title: "Product Match", desc: "Dr. Fixit, Fosroc, Sika, MYK…" },
  { icon: "Layers", title: "Cost Breakdown", desc: "Material + labour + GST, itemised" },
  { icon: "ShieldCheck", title: "Warranty Guide", desc: "Which warranty to insist on" },
];

export const AI_BULLETS = [
  "Upload a roof / dampness photo for AI condition analysis",
  "Smart questionnaire adapts to your answers",
  "Get exact product + brand recommendations",
  "Detailed cost estimate with live Bangalore pricing",
  "Procedure roadmap with warranty guidance",
];

// ── WaterProofX vs others (comparison matrix) ───────────────────────────
export type CompCell = { v: "yes" | "no" | "partial"; note: string };
export interface CompRow {
  feature: string;
  detail: string;
  wpx: CompCell;
  applicator: CompCell;
  marketplace: CompCell;
}

export const COMPARISON_COLS = [
  { id: "wpx", label: "WaterProofX", sub: "AI + engineered", featured: true },
  { id: "applicator", label: "Local Applicator", sub: "Painter / mason", featured: false },
  { id: "marketplace", label: "Generic Marketplace", sub: "Aggregator app", featured: false },
];

export const COMPARISON: CompRow[] = [
  {
    feature: "AI photo diagnosis",
    detail: "Upload a photo → instant AI condition report & root cause",
    wpx: { v: "yes", note: "Built-in AI" },
    applicator: { v: "no", note: "Guesswork" },
    marketplace: { v: "no", note: "Just a lead form" },
  },
  {
    feature: "Engineering inspection",
    detail: "Instrument moisture mapping, slope & crack survey before quoting",
    wpx: { v: "yes", note: "Free, instrument-based" },
    applicator: { v: "no", note: "Visual eyeballing" },
    marketplace: { v: "partial", note: "Subcontracted" },
  },
  {
    feature: "Root-cause fix",
    detail: "Treats the source, not just the visible patch",
    wpx: { v: "yes", note: "System-engineered" },
    applicator: { v: "no", note: "Surface patch" },
    marketplace: { v: "partial", note: "Varies by vendor" },
  },
  {
    feature: "Genuine branded materials",
    detail: "Authorised-distributor Dr. Fixit / Fosroc / Sika / MYK",
    wpx: { v: "yes", note: "Batch-traceable" },
    applicator: { v: "partial", note: "Often diluted" },
    marketplace: { v: "partial", note: "No guarantee" },
  },
  {
    feature: "Written warranty",
    detail: "Brand-backed, verifiable digital warranty card",
    wpx: { v: "yes", note: "Up to 10 years" },
    applicator: { v: "no", note: "Verbal only" },
    marketplace: { v: "partial", note: "Short / unclear" },
  },
  {
    feature: "Transparent pricing",
    detail: "Itemised material + labour + GST, no hidden cost",
    wpx: { v: "yes", note: "Live calculator" },
    applicator: { v: "partial", note: "Round figures" },
    marketplace: { v: "partial", note: "Markup added" },
  },
  {
    feature: "Court-proof quote freeze",
    detail: "Accepted quote price locked forever — never revised later",
    wpx: { v: "yes", note: "Snapshot versioned" },
    applicator: { v: "no", note: "Changes on site" },
    marketplace: { v: "no", note: "Re-quoted" },
  },
  {
    feature: "Post-service support",
    detail: "Free follow-up visits + master building-health report",
    wpx: { v: "yes", note: "Lifetime record" },
    applicator: { v: "no", note: "Disappears" },
    marketplace: { v: "partial", note: "Ticket queue" },
  },
  {
    feature: "Lowest-price guarantee",
    detail: "We match any genuine written quote at higher quality",
    wpx: { v: "yes", note: "Price-match" },
    applicator: { v: "partial", note: "Cheap, risky" },
    marketplace: { v: "no", note: "Premium fees" },
  },
];

// ── Bangalore service areas (local SEO) ─────────────────────────────────
export const AREAS: { name: string; blurb: string }[] = [
  { name: "Whitefield", blurb: "Apartments, villas & IT campuses around ITPL." },
  { name: "HSR Layout", blurb: "Independent homes & builder floors, all sectors." },
  { name: "Koramangala", blurb: "Older terraces & premium apartments, 1st–8th block." },
  { name: "Indiranagar", blurb: "Heritage bungalows & duplexes off 100ft Road." },
  { name: "Sarjapur Road", blurb: "New gated communities & high-rises." },
  { name: "Electronic City", blurb: "Tech parks, hostels & residential layouts." },
  { name: "JP Nagar", blurb: "Established residential homes, all phases." },
  { name: "Hebbal", blurb: "Lakeside apartments & independent houses." },
  { name: "Marathahalli", blurb: "Builder floors & rental apartment blocks." },
  { name: "Bannerghatta Road", blurb: "Gated villas & mid-rise apartments." },
  { name: "Jayanagar", blurb: "Classic independent homes & terraces." },
  { name: "Yelahanka", blurb: "New developments & independent houses up north." },
];

// ── FAQ (Bangalore-specific, SEO + AEO) ─────────────────────────────────
export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  { q: "How much does waterproofing cost in Bangalore?", a: "Waterproofing in Bangalore typically costs ₹25–₹250 per sq ft depending on the area type and system. Terrace waterproofing ranges ₹35–₹90/sq ft, bathrooms ₹90–₹180/sq ft and basements ₹120–₹250/sq ft. Use our free cost calculator for an instant estimate." },
  { q: "Which is the best waterproofing company in Bangalore?", a: "WaterProofX is a specialist waterproofing contractor serving all of Bangalore with a 4.9-star rating, 247+ reviews, a 10-year written warranty and free site inspection. As a pure-play waterproofing expert we deliver more durable results than general home-service marketplaces." },
  { q: "How long does waterproofing last?", a: "Professionally applied waterproofing lasts 8–15 years depending on the system and exposure. WaterProofX backs terrace and structural waterproofing with up to a 10-year warranty when done with our recommended membrane systems." },
  { q: "Is terrace waterproofing necessary in Bangalore?", a: "Yes. Bangalore receives roughly 970mm of rain annually, concentrated in the June–October monsoon. Unprotected terraces develop cracks and leakage that damage ceilings, steel reinforcement and interiors, so terrace waterproofing is essential preventive maintenance." },
  { q: "Can bathroom waterproofing be done without breaking tiles?", a: "In most cases, yes. We use nano-injection grouting and surface-applied membranes that seal leaks through existing tile joints, avoiding demolition for minor to moderate seepage. Severe cases may need targeted tile removal." },
  { q: "Which waterproofing chemical is best for terraces?", a: "For Bangalore terraces, polyurethane (PU) and APP membrane systems, along with brands like Dr. Fixit Newcoat and Fosroc Brushbond, offer the best crack-bridging and UV resistance. Our engineers recommend the right system after a free inspection." },
  { q: "Do you provide a warranty?", a: "Yes. WaterProofX provides up to a 10-year written warranty on eligible waterproofing systems, plus free post-service support visits and a verifiable digital warranty card." },
  { q: "How soon can you start the work?", a: "We usually complete a free inspection within 24–48 hours of your enquiry and can begin work shortly after approval, weather permitting." },
];
