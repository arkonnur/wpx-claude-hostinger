// Phase 9 — photo evidence. Crew attach site photos to execution-checklist
// items (and inspections). Stored on local disk under UPLOAD_DIR, served back
// through an unguessable per-tenant path. Storage target: Hostinger disk.
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { requireRole, getSession } from "../auth/guards";

export const uploadRoutes = new Hono();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
// Tenant ids are uuids; stored filenames are uuid + known ext. Both guarded to
// block path traversal — only these shapes ever touch the filesystem.
const TENANT_RE = /^[a-f0-9-]{8,36}$/i;
const NAME_RE = /^[a-f0-9-]{36}\.(jpg|jpeg|png|webp)$/i;

/** Upload one image (base64). Staff + crew only. Returns a stable served URL. */
uploadRoutes.post("/", requireRole("owner", "admin", "employee"), async (c) => {
  const s = await getSession(c);
  if (!s?.tenantId) return c.json({ error: "no_tenant" }, 401);

  const body = await c.req.json<{ imageBase64?: string; mime?: string }>().catch(() => null);
  if (!body?.imageBase64 || !body.mime) return c.json({ error: "bad_body" }, 400);
  const ext = EXT[body.mime];
  if (!ext) return c.json({ error: "unsupported_type" }, 415);

  let buf: Buffer;
  try {
    buf = Buffer.from(body.imageBase64, "base64");
  } catch {
    return c.json({ error: "bad_image" }, 400);
  }
  if (!buf.length) return c.json({ error: "empty_image" }, 400);
  if (buf.length > MAX_BYTES) return c.json({ error: "too_large" }, 413);

  if (!TENANT_RE.test(s.tenantId)) return c.json({ error: "bad_tenant" }, 400);
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(UPLOAD_DIR, s.tenantId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);

  return c.json({ url: `/api/uploads/file/${s.tenantId}/${name}` });
});

/** Serve an uploaded image. Unguessable uuid path; traversal-guarded. */
uploadRoutes.get("/file/:tenant/:name", async (c) => {
  const tenant = c.req.param("tenant");
  const name = c.req.param("name");
  if (!TENANT_RE.test(tenant) || !NAME_RE.test(name)) return c.json({ error: "not_found" }, 404);

  const ext = name.split(".").pop()!.toLowerCase();
  const type = CONTENT_TYPE[ext];
  if (!type) return c.json({ error: "not_found" }, 404);

  try {
    const buf = await readFile(path.join(UPLOAD_DIR, tenant, name));
    return c.body(buf, 200, {
      "content-type": type,
      "cache-control": "private, max-age=31536000, immutable",
    });
  } catch {
    return c.json({ error: "not_found" }, 404);
  }
});
