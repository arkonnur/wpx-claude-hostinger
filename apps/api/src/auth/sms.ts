// SMS OTP provider via AuthKey.io (https://authkey.io/sms-api-docs).
// We generate/verify the OTP ourselves; AuthKey only delivers it through a
// DLT-approved template (sid) whose body contains the {otp} (and optional {company}) vars.
//
// Env:
//   AUTHKEY_API_KEY   – account auth key (required to enable SMS)
//   AUTHKEY_SID       – template id with an {#otp#}/{otp} variable (required)
//   AUTHKEY_COMPANY   – value for a {company} template var (optional, default brand)
//   AUTHKEY_DEFAULT_CC– fallback country code when a number has no '+' prefix (default 91)
import type { WhatsAppProvider } from "./whatsapp";

const ENDPOINT = "https://api.authkey.io/request";

/** Split an E.164 (+919900112233) into { cc, mobile }. Falls back to default CC. */
function splitE164(e164: string, defaultCc: string): { cc: string; mobile: string } {
  const digits = e164.replace(/[^\d]/g, "");
  if (e164.startsWith("+91") || (digits.length === 12 && digits.startsWith("91"))) {
    return { cc: "91", mobile: digits.slice(-10) };
  }
  // Generic: assume last 10 are the subscriber number, rest is CC.
  if (digits.length > 10) return { cc: digits.slice(0, digits.length - 10), mobile: digits.slice(-10) };
  return { cc: defaultCc, mobile: digits };
}

export class AuthKeySmsProvider implements WhatsAppProvider {
  constructor(
    private apiKey: string,
    private sid: string,
    private company: string,
    private defaultCc: string,
  ) {}

  // SMS reaches any mobile; the WhatsApp-presence filter doesn't apply here.
  async hasWhatsApp(_: string) {
    return true;
  }

  async sendOtp(phoneE164: string, code: string) {
    const { cc, mobile } = splitE164(phoneE164, this.defaultCc);
    const url = new URL(ENDPOINT);
    url.searchParams.set("authkey", this.apiKey);
    url.searchParams.set("mobile", mobile);
    url.searchParams.set("country_code", cc);
    url.searchParams.set("sid", this.sid);
    url.searchParams.set("otp", code);
    if (this.company) url.searchParams.set("company", this.company);

    const res = await fetch(url.toString(), { method: "GET" });
    const text = await res.text();
    if (!res.ok) throw new Error(`authkey sms failed: ${res.status} ${text}`);
    // AuthKey returns JSON like {"Message":"Submitted Successfully","LogID":...} on success.
    let ok = true;
    try {
      const j = JSON.parse(text);
      const msg = String(j?.Message ?? j?.message ?? "").toLowerCase();
      if (msg && !msg.includes("success") && !msg.includes("submit")) ok = false;
    } catch {
      /* non-JSON body — rely on HTTP status */
    }
    if (!ok) throw new Error(`authkey sms rejected: ${text}`);
  }
}
