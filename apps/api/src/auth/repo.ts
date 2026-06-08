// Auth data access. All time-window counts back the anti-spam wall; identity
// rows back the one-OTP-per-number flow.
import { getDb } from "@wpx/db";
import {
  users, contacts, memberships, phoneRegistry, otpLog, otpChallenges, bans, tenants, trustedDevices,
} from "@wpx/db";
import { and, eq, gte, isNull, or, desc, sql } from "drizzle-orm";
import type { Role } from "@wpx/types";

const HOUR = 3_600_000;
const DAY = 86_400_000;
const since = (ms: number) => new Date(Date.now() - ms);

export async function getDefaultTenantId(): Promise<string> {
  const db = getDb();
  const row = (await db.select({ id: tenants.id }).from(tenants).limit(1))[0];
  if (!row) throw new Error("no tenant seeded — run db:seed");
  return row.id;
}

/* --------------------------------------------------------------- anti-spam */
export async function activeBan(ip?: string, deviceId?: string, userId?: string) {
  const db = getDb();
  const checks = [
    ip ? eq(bans.ip, ip) : undefined,
    deviceId ? eq(bans.deviceId, deviceId) : undefined,
    userId ? eq(bans.userId, userId) : undefined,
  ].filter(Boolean) as any[];
  if (!checks.length) return null;
  const rows = await db
    .select()
    .from(bans)
    .where(and(or(...checks), or(isNull(bans.expiresAt), gte(bans.expiresAt, new Date()))));
  return rows[0] ?? null;
}

export async function countOtpForPhoneLastHour(phoneHash: string): Promise<number> {
  const db = getDb();
  const r = await db
    .select({ n: sql<number>`count(*)` })
    .from(otpLog)
    .where(and(eq(otpLog.phoneHash, phoneHash), eq(otpLog.status, "sent"), gte(otpLog.createdAt, since(HOUR))));
  return Number(r[0]?.n ?? 0);
}
export async function countOtpForIpLastDay(ip: string): Promise<number> {
  const db = getDb();
  const r = await db
    .select({ n: sql<number>`count(*)` })
    .from(otpLog)
    .where(and(eq(otpLog.ip, ip), eq(otpLog.status, "sent"), gte(otpLog.createdAt, since(DAY))));
  return Number(r[0]?.n ?? 0);
}
export async function countPhonesForDeviceToday(deviceId: string): Promise<number> {
  const db = getDb();
  const r = await db
    .select({ n: sql<number>`count(distinct ${otpLog.phoneHash})` })
    .from(otpLog)
    .where(and(eq(otpLog.deviceId, deviceId), gte(otpLog.createdAt, since(DAY))));
  return Number(r[0]?.n ?? 0);
}

export async function logOtp(status: "sent" | "verified" | "failed" | "blocked", phoneHash: string, ip?: string, deviceId?: string) {
  await getDb().insert(otpLog).values({ phoneHash, ip, deviceId, status });
}

/* ------------------------------------------------------------- challenges */
export async function storeChallenge(phoneHash: string, codeHash: string, expiresAt: Date) {
  const db = getDb();
  await db.update(otpChallenges).set({ consumed: true }).where(and(eq(otpChallenges.phoneHash, phoneHash), eq(otpChallenges.consumed, false)));
  await db.insert(otpChallenges).values({ phoneHash, codeHash, expiresAt });
}
export async function activeChallenge(phoneHash: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(otpChallenges)
    .where(and(eq(otpChallenges.phoneHash, phoneHash), eq(otpChallenges.consumed, false)))
    .orderBy(desc(otpChallenges.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
export async function bumpAttempt(id: string) {
  await getDb().update(otpChallenges).set({ attempts: sql`${otpChallenges.attempts} + 1` }).where(eq(otpChallenges.id, id));
}
export async function consumeChallenge(id: string) {
  await getDb().update(otpChallenges).set({ consumed: true }).where(eq(otpChallenges.id, id));
}

/* ---------------------------------------------------------------- identity */
export async function getRegistry(phoneHash: string) {
  const rows = await getDb().select().from(phoneRegistry).where(eq(phoneRegistry.phoneHash, phoneHash)).limit(1);
  return rows[0] ?? null;
}
export async function markVerified(phoneHash: string) {
  const db = getDb();
  const existing = await getRegistry(phoneHash);
  if (existing) {
    await db.update(phoneRegistry).set({ verifiedAt: new Date() }).where(eq(phoneRegistry.phoneHash, phoneHash));
  } else {
    await db.insert(phoneRegistry).values({ phoneHash, verifiedAt: new Date() });
  }
}
export async function markHasAccount(phoneHash: string) {
  await getDb().update(phoneRegistry).set({ hasAccount: true }).where(eq(phoneRegistry.phoneHash, phoneHash));
}

export async function getOrCreateContact(tenantId: string, phone: string, phoneHash: string) {
  const db = getDb();
  const rows = await db.select().from(contacts).where(and(eq(contacts.tenantId, tenantId), eq(contacts.phoneHash, phoneHash))).limit(1);
  if (rows[0]) return rows[0];
  await db.insert(contacts).values({ tenantId, phone, phoneHash, verifiedAt: new Date() });
  const created = await db.select().from(contacts).where(and(eq(contacts.tenantId, tenantId), eq(contacts.phoneHash, phoneHash))).limit(1);
  return created[0]!;
}

export async function findUserByEmail(email: string) {
  const rows = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}
export async function findUserById(id: string) {
  const rows = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}
export async function findUserByPhoneHash(phoneHash: string) {
  const c = await getDb().select().from(contacts).where(eq(contacts.phoneHash, phoneHash)).limit(1);
  if (!c[0]) return null;
  const u = await getDb().select().from(users).where(eq(users.contactId, c[0].id)).limit(1);
  return u[0] ?? null;
}
export async function createUser(opts: { email: string; passwordHash: string; name?: string; phone: string; contactId: string }) {
  const db = getDb();
  await db.insert(users).values({
    email: opts.email, passwordHash: opts.passwordHash, name: opts.name, phone: opts.phone, contactId: opts.contactId,
  });
  return (await findUserByEmail(opts.email))!;
}
export async function ensureMembership(userId: string, tenantId: string, role: Role) {
  const db = getDb();
  const rows = await db.select().from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId))).limit(1);
  if (rows[0]) return rows[0];
  await db.insert(memberships).values({ userId, tenantId, role });
  const created = await db.select().from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId))).limit(1);
  return created[0]!;
}
export async function primaryMembership(userId: string) {
  const rows = await getDb().select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function trustDevice(contactId: string, deviceId: string, days = 30) {
  await getDb().insert(trustedDevices).values({ contactId, deviceId, lastOtpAt: new Date(), expiresAt: new Date(Date.now() + days * DAY) });
}
