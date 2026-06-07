// WaterProofX MySQL schema (Drizzle). Multi-tenant; NO RLS (MySQL) — tenant +
// client isolation is enforced in the app via the scoped repository layer.
// Every business table carries tenant_id. See MASTER_BUILD_SPEC §3, §16, §19, §20.
import { randomUUID } from "node:crypto";
import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  boolean,
  timestamp,
  json,
  mysqlEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

const id = () => varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID());
const tenantId = () => varchar("tenant_id", { length: 36 }).notNull();
const created = () => timestamp("created_at").notNull().defaultNow();
const updated = () => timestamp("updated_at").notNull().defaultNow().onUpdateNow();
const money = (name: string) => decimal(name, { precision: 12, scale: 2 });

/* ------------------------------------------------------------------ tenancy */
export const tenants = mysqlTable("tenants", {
  id: id(),
  name: varchar("name", { length: 191 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull(),
  branding: json("branding"),
  pricingConfig: json("pricing_config"),
  status: mysqlEnum("status", ["active", "suspended"]).notNull().default("active"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ slugUx: uniqueIndex("tenants_slug_ux").on(t.slug) }));

export const users = mysqlTable("users", {
  id: id(),
  email: varchar("email", { length: 191 }),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("password_hash", { length: 191 }),
  name: varchar("name", { length: 191 }),
  contactId: varchar("contact_id", { length: 36 }), // link to contacts (phone identity)
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({
  emailUx: uniqueIndex("users_email_ux").on(t.email),
  phoneIx: index("users_phone_ix").on(t.phone),
}));

export const memberships = mysqlTable("memberships", {
  id: id(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  tenantId: tenantId(),
  role: mysqlEnum("role", ["owner", "admin", "employee", "client"]).notNull(),
  createdAt: created(),
}, (t) => ({
  ux: uniqueIndex("memberships_ux").on(t.userId, t.tenantId, t.role),
  tenantIx: index("memberships_tenant_ix").on(t.tenantId),
}));

/* ------------------------------------------------------ identity / anti-spam */
export const phoneRegistry = mysqlTable("phone_registry", {
  id: id(),
  phoneHash: varchar("phone_hash", { length: 64 }).notNull(),
  verifiedAt: timestamp("verified_at"),
  hasAccount: boolean("has_account").notNull().default(false),
  riskFlags: json("risk_flags"),
  createdAt: created(),
}, (t) => ({ ux: uniqueIndex("phone_registry_ux").on(t.phoneHash) }));

export const otpLog = mysqlTable("otp_log", {
  id: id(),
  phoneHash: varchar("phone_hash", { length: 64 }).notNull(),
  ip: varchar("ip", { length: 64 }),
  deviceId: varchar("device_id", { length: 64 }),
  status: mysqlEnum("status", ["sent", "verified", "failed", "blocked"]).notNull(),
  createdAt: created(),
}, (t) => ({
  phoneIx: index("otp_log_phone_ix").on(t.phoneHash, t.createdAt),
  ipIx: index("otp_log_ip_ix").on(t.ip, t.createdAt),
}));

export const otpChallenges = mysqlTable("otp_challenges", {
  id: id(),
  phoneHash: varchar("phone_hash", { length: 64 }).notNull(),
  codeHash: varchar("code_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: int("attempts").notNull().default(0),
  consumed: boolean("consumed").notNull().default(false),
  createdAt: created(),
}, (t) => ({ phoneIx: index("otp_challenges_phone_ix").on(t.phoneHash, t.createdAt) }));

export const trustedDevices = mysqlTable("trusted_devices", {
  id: id(),
  contactId: varchar("contact_id", { length: 36 }).notNull(),
  deviceId: varchar("device_id", { length: 64 }).notNull(),
  lastOtpAt: timestamp("last_otp_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: created(),
}, (t) => ({ ix: index("trusted_devices_ix").on(t.contactId, t.deviceId) }));

export const refreshTokens = mysqlTable("refresh_tokens", {
  id: id(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  tokenHash: varchar("token_hash", { length: 191 }).notNull(),
  deviceId: varchar("device_id", { length: 64 }),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: created(),
}, (t) => ({ ix: index("refresh_tokens_ix").on(t.userId) }));

export const spamSignals = mysqlTable("spam_signals", {
  id: id(),
  kind: mysqlEnum("kind", ["irrelevant_image", "duplicate_image", "rate", "bot", "voip", "abuse"]).notNull(),
  ip: varchar("ip", { length: 64 }),
  deviceId: varchar("device_id", { length: 64 }),
  phoneHash: varchar("phone_hash", { length: 64 }),
  detail: json("detail"),
  createdAt: created(),
}, (t) => ({ ipIx: index("spam_signals_ip_ix").on(t.ip, t.createdAt) }));

export const bans = mysqlTable("bans", {
  id: id(),
  ip: varchar("ip", { length: 64 }),
  deviceId: varchar("device_id", { length: 64 }),
  userId: varchar("user_id", { length: 36 }),
  reason: varchar("reason", { length: 255 }),
  strikeCount: int("strike_count").notNull().default(1),
  expiresAt: timestamp("expires_at"), // null = permanent
  createdAt: created(),
}, (t) => ({ ipIx: index("bans_ip_ix").on(t.ip) }));

/* ----------------------------------------------------------------- CRM core */
export const contacts = mysqlTable("contacts", {
  id: id(),
  tenantId: tenantId(),
  name: varchar("name", { length: 191 }),
  phone: varchar("phone", { length: 20 }),
  phoneHash: varchar("phone_hash", { length: 64 }),
  email: varchar("email", { length: 191 }),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  verifiedAt: timestamp("verified_at"),
  hasAccount: boolean("has_account").notNull().default(false),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({
  tenantIx: index("contacts_tenant_ix").on(t.tenantId),
  phoneIx: index("contacts_phone_ix").on(t.tenantId, t.phoneHash),
}));

export const leads = mysqlTable("leads", {
  id: id(),
  tenantId: tenantId(),
  contactId: varchar("contact_id", { length: 36 }),
  service: varchar("service", { length: 40 }),
  severity: varchar("severity", { length: 20 }),
  areaSqft: int("area_sqft"),
  status: mysqlEnum("status", ["new", "contacted", "site_visit_scheduled", "quoted", "converted", "lost"]).notNull().default("new"),
  source: varchar("source", { length: 80 }),
  utm: json("utm"),
  estimatedValue: money("estimated_value"),
  score: int("score"),
  scoreTier: mysqlEnum("score_tier", ["hot", "warm", "cold"]),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({
  tenantIx: index("leads_tenant_ix").on(t.tenantId, t.status),
  scoreIx: index("leads_score_ix").on(t.tenantId, t.score),
}));

export const appointments = mysqlTable("appointments", {
  id: id(),
  tenantId: tenantId(),
  leadId: varchar("lead_id", { length: 36 }).notNull(),
  scheduledDate: timestamp("scheduled_date"),
  assignedTo: varchar("assigned_to", { length: 36 }),
  status: mysqlEnum("status", ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).notNull().default("scheduled"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ tenantIx: index("appointments_tenant_ix").on(t.tenantId) }));

/* ----------------------------------------------- inspections / jobs / exec */
export const inspections = mysqlTable("inspections", {
  id: id(),
  tenantId: tenantId(),
  leadId: varchar("lead_id", { length: 36 }),
  appointmentId: varchar("appointment_id", { length: 36 }),
  inspectorId: varchar("inspector_id", { length: 36 }),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "report_ready"]).notNull().default("draft"),
  // detailed field readings (merged from wpx-main + folder 1):
  moisturePoints: json("moisture_points"),
  slopePoints: json("slope_points"),
  soundness: json("soundness"),
  cracks: json("cracks"),
  defects: json("defects"),
  readings: json("readings"),
  signature: json("signature"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ tenantIx: index("inspections_tenant_ix").on(t.tenantId, t.status) }));

export const inspectionPhotos = mysqlTable("inspection_photos", {
  id: id(),
  tenantId: tenantId(),
  inspectionId: varchar("inspection_id", { length: 36 }).notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  zone: varchar("zone", { length: 80 }),
  caption: varchar("caption", { length: 255 }),
  createdAt: created(),
}, (t) => ({ ix: index("inspection_photos_ix").on(t.inspectionId) }));

export const jobs = mysqlTable("jobs", {
  id: id(),
  tenantId: tenantId(),
  inspectionId: varchar("inspection_id", { length: 36 }),
  quoteId: varchar("quote_id", { length: 36 }),
  contactId: varchar("contact_id", { length: 36 }),
  assignedTo: varchar("assigned_to", { length: 36 }),
  status: mysqlEnum("status", ["scheduled", "mobilising", "in_progress", "qa", "handover", "warranty_issued", "cancelled"]).notNull().default("scheduled"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ tenantIx: index("jobs_tenant_ix").on(t.tenantId, t.status) }));

export const executionItems = mysqlTable("execution_items", {
  id: id(),
  tenantId: tenantId(),
  jobId: varchar("job_id", { length: 36 }).notNull(),
  zone: varchar("zone", { length: 80 }).notNull(),
  label: varchar("label", { length: 191 }).notNull(),
  status: mysqlEnum("status", ["pending", "done", "na"]).notNull().default("pending"),
  material: varchar("material", { length: 191 }),
  batchNo: varchar("batch_no", { length: 80 }),
  quantity: varchar("quantity", { length: 40 }),
  coverage: varchar("coverage", { length: 80 }),
  crew: varchar("crew", { length: 191 }),
  weather: varchar("weather", { length: 80 }),
  photos: json("photos"),
  qaVerified: boolean("qa_verified").notNull().default(false),
  qaBy: varchar("qa_by", { length: 36 }),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ jobIx: index("execution_items_job_ix").on(t.jobId) }));

/* ------------------------------------------- estimates / quotes / warranties */
export const estimates = mysqlTable("estimates", {
  id: id(),
  tenantId: tenantId(),
  contactId: varchar("contact_id", { length: 36 }),
  leadId: varchar("lead_id", { length: 36 }),
  sessionId: varchar("session_id", { length: 64 }),
  source: mysqlEnum("source", ["calculator", "ai", "boq"]).notNull().default("calculator"),
  inputs: json("inputs"),
  result: json("result"),
  configVersion: varchar("config_version", { length: 64 }),
  createdAt: created(),
}, (t) => ({ tenantIx: index("estimates_tenant_ix").on(t.tenantId) }));

export const quotes = mysqlTable("quotes", {
  id: id(),
  tenantId: tenantId(),
  contactId: varchar("contact_id", { length: 36 }),
  leadId: varchar("lead_id", { length: 36 }),
  inspectionId: varchar("inspection_id", { length: 36 }),
  number: varchar("number", { length: 40 }),
  lineItems: json("line_items"),
  subtotal: money("subtotal"),
  gst: money("gst"),
  total: money("total"),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "expired"]).notNull().default("draft"),
  validUntil: timestamp("valid_until"),
  pdfUrl: varchar("pdf_url", { length: 512 }),
  // FROZEN snapshot when status leaves draft (court-proof, never recalculated):
  priceSnapshot: json("price_snapshot"),
  priceListVersion: varchar("price_list_version", { length: 64 }),
  formulaVersion: varchar("formula_version", { length: 64 }),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ tenantIx: index("quotes_tenant_ix").on(t.tenantId, t.status) }));

export const warranties = mysqlTable("warranties", {
  id: id(),
  tenantId: tenantId(),
  jobId: varchar("job_id", { length: 36 }),
  contactId: varchar("contact_id", { length: 36 }),
  cardNo: varchar("card_no", { length: 40 }).notNull(),
  qrToken: varchar("qr_token", { length: 64 }).notNull(),
  brand: varchar("brand", { length: 120 }),
  years: int("years"),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date"),
  snapshot: json("snapshot"),
  createdAt: created(),
}, (t) => ({
  cardUx: uniqueIndex("warranties_card_ux").on(t.cardNo),
  qrUx: uniqueIndex("warranties_qr_ux").on(t.qrToken),
}));

/* ------------------------------------------------- dynamic config (settings) */
export const products = mysqlTable("products", {
  id: id(),
  tenantId: tenantId(),
  brand: varchar("brand", { length: 120 }).notNull(),
  name: varchar("name", { length: 191 }).notNull(),
  category: varchar("category", { length: 80 }),
  coverageValue: decimal("coverage_value", { precision: 10, scale: 3 }),
  coverageUnit: varchar("coverage_unit", { length: 20 }),
  packSize: decimal("pack_size", { precision: 10, scale: 3 }),
  packUnit: varchar("pack_unit", { length: 20 }),
  mrp: money("mrp"),
  costPrice: money("cost_price"),
  marginPct: decimal("margin_pct", { precision: 6, scale: 2 }),
  tier: mysqlEnum("tier", ["basic", "medium", "premium", "industrial"]),
  active: boolean("active").notNull().default(true),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ tenantIx: index("products_tenant_ix").on(t.tenantId, t.active) }));

export const priceLists = mysqlTable("price_lists", {
  id: id(),
  tenantId: tenantId(),
  version: varchar("version", { length: 64 }).notNull(),
  rates: json("rates"), // product_id -> rate, plus service base rates
  active: boolean("active").notNull().default(true),
  createdAt: created(),
}, (t) => ({ tenantIx: index("price_lists_tenant_ix").on(t.tenantId, t.active) }));

export const formulaSets = mysqlTable("formula_sets", {
  id: id(),
  tenantId: tenantId(),
  version: varchar("version", { length: 64 }).notNull(),
  fingerprint: varchar("fingerprint", { length: 32 }),
  formulas: json("formulas"),
  active: boolean("active").notNull().default(true),
  createdAt: created(),
}, (t) => ({ tenantIx: index("formula_sets_tenant_ix").on(t.tenantId, t.active) }));

export const brandSpecs = mysqlTable("brand_specs", {
  id: id(),
  tenantId: tenantId(),
  name: varchar("name", { length: 120 }).notNull(),
  spec: json("spec"),
  active: boolean("active").notNull().default(true),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ tenantIx: index("brand_specs_tenant_ix").on(t.tenantId) }));

export const toolConfigs = mysqlTable("tool_configs", {
  id: id(),
  tenantId: tenantId(),
  toolKey: varchar("tool_key", { length: 80 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  gate: mysqlEnum("gate", ["public", "otp", "account"]).notNull().default("public"),
  access: mysqlEnum("access", ["self_serve", "site_visit_only"]).notNull().default("self_serve"),
  params: json("params"),
  blankTemplate: json("blank_template"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ ux: uniqueIndex("tool_configs_ux").on(t.tenantId, t.toolKey) }));

export const orgSettings = mysqlTable("org_settings", {
  id: id(),
  tenantId: tenantId(),
  key: varchar("key", { length: 80 }).notNull(),
  value: json("value"),
  updatedAt: updated(),
}, (t) => ({ ux: uniqueIndex("org_settings_ux").on(t.tenantId, t.key) }));

/* ---------------------------------------- reports / tracking / ai / geo / audit */
export const masterReports = mysqlTable("master_reports", {
  id: id(),
  tenantId: tenantId(),
  contactId: varchar("contact_id", { length: 36 }),
  sessionId: varchar("session_id", { length: 64 }),
  sections: json("sections"),
  completeness: int("completeness").notNull().default(0),
  healthScore: int("health_score"),
  leadScore: int("lead_score"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({
  tenantIx: index("master_reports_tenant_ix").on(t.tenantId),
  contactIx: index("master_reports_contact_ix").on(t.contactId),
}));

export const anonymousSessions = mysqlTable("anonymous_sessions", {
  id: id(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  tenantId: varchar("tenant_id", { length: 36 }),
  profile: json("profile"),
  source: varchar("source", { length: 80 }),
  utm: json("utm"),
  mergedContactId: varchar("merged_contact_id", { length: 36 }),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => ({ ux: uniqueIndex("anon_sessions_ux").on(t.sessionId) }));

export const clientEvents = mysqlTable("client_events", {
  id: id(),
  tenantId: tenantId(),
  contactId: varchar("contact_id", { length: 36 }),
  sessionId: varchar("session_id", { length: 64 }),
  type: varchar("type", { length: 60 }).notNull(),
  payload: json("payload"),
  createdAt: created(),
}, (t) => ({
  contactIx: index("client_events_contact_ix").on(t.contactId, t.createdAt),
  sessionIx: index("client_events_session_ix").on(t.sessionId),
}));

export const photoAnalyses = mysqlTable("photo_analyses", {
  id: id(),
  tenantId: tenantId(),
  contactId: varchar("contact_id", { length: 36 }),
  phash: varchar("phash", { length: 64 }),
  url: varchar("url", { length: 512 }),
  isWaterproofingSurface: boolean("is_waterproofing_surface"),
  result: json("result"),
  rejected: boolean("rejected").notNull().default(false),
  createdAt: created(),
}, (t) => ({
  tenantIx: index("photo_analyses_tenant_ix").on(t.tenantId),
  phashIx: index("photo_analyses_phash_ix").on(t.phash),
}));

export const geocodeCache = mysqlTable("geocode_cache", {
  id: id(),
  latKey: varchar("lat_key", { length: 16 }).notNull(),
  lngKey: varchar("lng_key", { length: 16 }).notNull(),
  address: text("address"),
  raw: json("raw"),
  createdAt: created(),
}, (t) => ({ ux: uniqueIndex("geocode_cache_ux").on(t.latKey, t.lngKey) }));

export const auditLog = mysqlTable("audit_log", {
  id: id(),
  tenantId: tenantId(),
  actorId: varchar("actor_id", { length: 36 }),
  action: varchar("action", { length: 80 }).notNull(),
  entity: varchar("entity", { length: 80 }),
  entityId: varchar("entity_id", { length: 36 }),
  before: json("before"),
  after: json("after"),
  createdAt: created(),
}, (t) => ({ tenantIx: index("audit_log_tenant_ix").on(t.tenantId, t.createdAt) }));
