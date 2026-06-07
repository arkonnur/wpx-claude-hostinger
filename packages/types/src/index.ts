// Shared cross-cutting domain types. Single source of truth for enums/statuses
// used by api, web, marketing and db packages.

export type Role = "owner" | "admin" | "employee" | "client";

export type LeadStatus =
  | "new"
  | "contacted"
  | "site_visit_scheduled"
  | "quoted"
  | "converted"
  | "lost";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type InspectionStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "report_ready";

export type JobStatus =
  | "scheduled"
  | "mobilising"
  | "in_progress"
  | "qa"
  | "handover"
  | "warranty_issued"
  | "cancelled";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

/** A quote/job/warranty in these states is FROZEN (price snapshot locked). */
export const FROZEN_QUOTE_STATES: QuoteStatus[] = ["sent", "accepted"];

/** Tool gating + access axes (config-driven, super-admin editable). */
export type ToolGate = "public" | "otp" | "account";
export type ToolAccess = "self_serve" | "site_visit_only";

export interface ToolConfig {
  toolKey: string;
  enabled: boolean;
  order: number;
  gate: ToolGate;
  access: ToolAccess;
  params: Record<string, unknown>;
  /** for site_visit_only: the blank report template shown locked to client. */
  blankTemplate?: Record<string, unknown>;
}

/** Shared project profile — written by any tool, prefilled into every other (less typing). */
export interface ProjectProfile {
  service?: string;
  areaSqft?: number;
  areaUnit?: "sqft" | "sqm" | "sqyd";
  shape?: string;
  dimensions?: Record<string, number>;
  severity?: string;
  buildingType?: string;
  brandPref?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export type TrustScope = "tools" | "account";

export interface VerifiedClaims {
  contactId: string;
  phoneHash: string;
  scope: TrustScope;
  verifiedAt: number;
}

export interface SessionClaims {
  userId: string;
  contactId: string;
  tenantId: string;
  role: Role;
}
