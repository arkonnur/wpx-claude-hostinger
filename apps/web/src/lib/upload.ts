// Client helper for uploading site-evidence photos. Validates locally, sends
// base64 to /api/uploads, returns the served URL path.
import { post } from "./api";

export const UPLOAD_MAX_MB = 6;
export const UPLOAD_OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s); // strip data: prefix
    };
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

/** Validate + upload one image. Throws Error with a user-facing message on reject. */
export async function uploadPhoto(file: File): Promise<string> {
  if (!UPLOAD_OK_TYPES.includes(file.type)) throw new Error("Use a JPG, PNG or WEBP photo.");
  if (file.size > UPLOAD_MAX_MB * 1024 * 1024) throw new Error(`Photo must be under ${UPLOAD_MAX_MB} MB.`);
  const imageBase64 = await toBase64(file);
  const r = await post<{ url: string }>("/api/uploads", { imageBase64, mime: file.type });
  return r.url;
}
