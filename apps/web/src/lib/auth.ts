// Auth client — mirrors apps/api/src/auth/routes.ts. Drives the one-OTP smart flow.
import { post, get } from "./api";
import type { Role } from "@wpx/types";

export type CheckRoute = "login" | "set_password" | "otp";

export const checkPhone = (phone: string) => post<{ route: CheckRoute }>("/api/auth/check", { phone });

export const sendOtp = (phone: string, opts?: { turnstileToken?: string; honeypot?: string; formFillMs?: number }) =>
  post<{ ok: true; ttlMs: number }>("/api/auth/otp/send", { phone, ...opts });

export const verifyOtp = (phone: string, code: string) =>
  post<{ verified: true; hasAccount: boolean; contactId: string }>("/api/auth/otp/verify", { phone, code });

export const register = (data: { phone: string; email: string; password: string; name?: string }) =>
  post<{ ok: true; role: Role }>("/api/auth/register", data);

export const login = (email: string, password: string) =>
  post<{ ok?: true; role?: Role; needs_otp?: boolean; phone?: string }>("/api/auth/login", { email, password });

export const resetPassword = (data: { email: string; phone: string; password: string }) =>
  post<{ ok: true; role: Role }>("/api/auth/reset-password", data);

export const logout = () => post<{ ok: true }>("/api/auth/logout", {});

export interface Me {
  session: { userId: string; role: Role; tenantId: string; contactId: string } | null;
  user: { name: string | null; email: string | null } | null;
  verified: { contactId: string; scope: string } | null;
}
export const me = () => get<Me>("/api/auth/me");
