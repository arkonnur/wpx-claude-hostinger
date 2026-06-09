// Fire-and-forget client telemetry → /api/events. Powers the contact timeline,
// engagement scoring, and tool funnels. Never throws; never blocks the UI.
import { post } from "./api";

const SKEY = "wpx_session_id";

export function getSessionId(): string {
  let id = localStorage.getItem(SKEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SKEY, id);
  }
  return id;
}

export type EventType =
  | "tool_view"
  | "calculator_run"
  | "estimate_view"
  | "diagnose_start"
  | "diagnose_result"
  | "report_view"
  | "warranty_check"
  | "book_open"
  | "lead_submit"
  | "otp_verified"
  | "signup"
  | "login";

export function track(type: EventType, payload?: Record<string, unknown>): void {
  try {
    void post("/api/events", { type, sessionId: getSessionId(), payload }).catch(() => {});
  } catch {
    /* telemetry must never break the app */
  }
}
