import { json, error } from "../_lib/db.js";
import { requireAdmin } from "../_lib/auth.js";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB safety cap (client already compresses images)
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function randomId() {
  return crypto.randomUUID().replace(/-/g, "");
}

// POST /api/upload  (multipart/form-data, field "file")
export async function onRequestPost({ request, env }) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  if (!env.PRODUCT_IMAGES) return error("Image storage is not configured", 500);

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return error("Expected multipart/form-data upload", 400);
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return error("No file provided", 400);
  if (!ALLOWED_TYPES.has(file.type)) return error("Only JPEG, PNG or WebP images are allowed", 400);
  if (file.size > MAX_BYTES) return error("Image is too large (max 5MB)", 400);

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const shopId = session.shop_id || "super";
  const key = `shop-${shopId}/${Date.now()}-${randomId()}.${ext}`;

  await env.PRODUCT_IMAGES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const url = new URL(request.url);
  return json({ url: `${url.origin}/api/images/${key}`, key });
}
