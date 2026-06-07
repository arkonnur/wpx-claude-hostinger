// Stable per-browser device id — sent as x-device-id so the API can dedup/trust
// devices (anti-spam + skip-OTP-on-trusted-device). Not PII.
const KEY = "wpx_device_id";

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
