// One-off: create (or promote) an owner account for the default tenant.
// Env: ADMIN_EMAIL, ADMIN_PASSWORD (>=8), ADMIN_PHONE  (+ DB_* / DATABASE_URL).
// Run: node create-admin.mjs   (after esbuild bundle, mysql2 external)
import { and, eq } from "drizzle-orm";
import { getDb, memberships } from "@wpx/db";
import { normalizePhone, hashPhone, hashPassword } from "../auth/crypto";
import * as repo from "../auth/repo";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const pw = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE;
  if (!email || !pw || pw.length < 8 || !phone) {
    throw new Error("set ADMIN_EMAIL, ADMIN_PASSWORD (>=8 chars), ADMIN_PHONE");
  }
  const e164 = normalizePhone(phone);
  if (!e164) throw new Error("bad ADMIN_PHONE");

  const tenantId = await repo.getDefaultTenantId();
  const phoneHash = hashPhone(e164);

  const existing = await repo.findUserByEmail(email);
  let userId: string;
  if (existing) {
    // Guard against accidental privilege escalation of an unrelated account.
    if (process.env.ALLOW_PROMOTE !== "1") {
      throw new Error(`user ${email} already exists — set ALLOW_PROMOTE=1 to promote to owner`);
    }
    if (existing.phone && existing.phone !== e164) {
      throw new Error(`existing user phone does not match ADMIN_PHONE — refusing to promote`);
    }
    userId = existing.id;
    // Apply the supplied password too, so an OTP-only account (no passwordHash)
    // can actually sign in with ADMIN_PASSWORD after promotion.
    await repo.setUserPassword(userId, await hashPassword(pw));
    console.warn(`[create-admin] PROMOTING existing user ${email} to owner (password reset applied)`);
  } else {
    const contact = await repo.getOrCreateContact(tenantId, e164, phoneHash);
    const user = await repo.createUser({
      email,
      passwordHash: await hashPassword(pw),
      name: "Admin",
      phone: e164,
      contactId: contact.id,
    });
    userId = user.id;
    await repo.markHasAccount(phoneHash);
    console.log("[create-admin] user created");
  }

  await repo.ensureMembership(userId, tenantId, "owner");
  // Force owner even if a prior membership existed at a lower role.
  await getDb()
    .update(memberships)
    .set({ role: "owner" })
    .where(and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId)));

  console.log(`[create-admin] OK — ${email} is owner of tenant ${tenantId}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("[create-admin] FAILED:", e);
  process.exit(1);
});
