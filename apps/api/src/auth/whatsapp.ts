// WhatsApp OTP provider — pluggable. Vendor TBD (Gupshup/Meta Cloud/Interakt…).
// Dev stub logs the code so the flow works without a paid account.
import { AuthKeySmsProvider } from "./sms";

export interface WhatsAppProvider {
  /** Returns true if the number has WhatsApp (real filter vs fake/competitor landlines). */
  hasWhatsApp(phoneE164: string): Promise<boolean>;
  sendOtp(phoneE164: string, code: string): Promise<void>;
}

class DevProvider implements WhatsAppProvider {
  async hasWhatsApp(_: string) {
    return true;
  }
  async sendOtp(phone: string, code: string) {
    console.log(`[whatsapp:dev] OTP for ${phone} = ${code}`);
  }
}

// TODO(Phase 9): implement real vendor using WHATSAPP_API_URL / TOKEN / SENDER.
class HttpProvider implements WhatsAppProvider {
  constructor(private url: string, private token: string, private sender: string) {}
  async hasWhatsApp(_: string) {
    return true; // most vendors validate at send-time; refine per vendor.
  }
  async sendOtp(phone: string, code: string) {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.token}` },
      body: JSON.stringify({ to: phone, from: this.sender, template: "otp", code }),
    });
    if (!res.ok) throw new Error(`whatsapp send failed: ${res.status}`);
  }
}

export function getWhatsApp(): WhatsAppProvider {
  const { WHATSAPP_API_URL, WHATSAPP_API_TOKEN, WHATSAPP_SENDER } = process.env;
  if (WHATSAPP_API_URL && WHATSAPP_API_TOKEN && WHATSAPP_SENDER) {
    return new HttpProvider(WHATSAPP_API_URL, WHATSAPP_API_TOKEN, WHATSAPP_SENDER);
  }
  return new DevProvider();
}

/**
 * OTP delivery channel selector. Priority: AuthKey SMS (now) → WhatsApp → dev stub.
 * Both channels implement WhatsAppProvider, so callers stay channel-agnostic.
 */
export function getOtpProvider(): WhatsAppProvider {
  const { AUTHKEY_API_KEY, AUTHKEY_SID, AUTHKEY_COMPANY, AUTHKEY_DEFAULT_CC } = process.env;
  if (AUTHKEY_API_KEY && AUTHKEY_SID) {
    return new AuthKeySmsProvider(
      AUTHKEY_API_KEY,
      AUTHKEY_SID,
      AUTHKEY_COMPANY || "WaterProofX",
      AUTHKEY_DEFAULT_CC || "91",
    );
  }
  return getWhatsApp();
}
