// Thin API client. Same-origin in prod (Cloudflare/Apache proxy), Vite proxy in dev.
import { getDeviceId } from "./device";

const BASE = import.meta.env.VITE_API_BASE ?? "";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public data?: any) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", "x-device-id": getDeviceId() },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error ?? "error", data?.reason ?? data?.error ?? `HTTP ${res.status}`, res.status, data);
  return data as T;
}

export const post = <T>(path: string, body: unknown) => request<T>("POST", path, body);
export const get = <T>(path: string) => request<T>("GET", path);
export const patch = <T>(path: string, body: unknown) => request<T>("PATCH", path, body);
