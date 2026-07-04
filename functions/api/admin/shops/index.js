import { json, error } from "../../../_lib/db.js";
import { requireAdmin, hashPassword } from "../../../_lib/auth.js";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/admin/shops
export async function onRequestGet({ request, env }) {
  const session = await requireAdmin(request, env, "super_admin");
  if (session instanceof Response) return session;

  const { results } = await env.DB.prepare(
    "SELECT id, slug, name, phone, is_active, created_at FROM shops ORDER BY created_at DESC"
  ).all();

  return json({ shops: results });
}

// POST /api/admin/shops
// { name, phone, address, whatsapp_number, instagram_url, facebook_url, other_social_url,
//   logo_url, admin_email, admin_password }
export async function onRequestPost({ request, env }) {
  const session = await requireAdmin(request, env, "super_admin");
  if (session instanceof Response) return session;

  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.name.trim()) return error("Shop name is required", 400);
  if (!body.admin_email || !body.admin_password) {
    return error("A sub-admin email and password are required to create a shop", 400);
  }

  let slug = slugify(body.slug || body.name);
  if (!slug) return error("Could not generate a URL slug from the shop name", 400);

  // Ensure slug uniqueness by appending a numeric suffix if needed.
  let finalSlug = slug;
  let suffix = 1;
  while (await env.DB.prepare("SELECT id FROM shops WHERE slug = ?").bind(finalSlug).first()) {
    suffix += 1;
    finalSlug = `${slug}-${suffix}`;
  }

  const shopResult = await env.DB.prepare(
    `INSERT INTO shops (slug, name, logo_url, phone, address, whatsapp_number, instagram_url, facebook_url, other_social_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      finalSlug,
      body.name.trim(),
      body.logo_url || null,
      body.phone || null,
      body.address || null,
      body.whatsapp_number || null,
      body.instagram_url || null,
      body.facebook_url || null,
      body.other_social_url || null
    )
    .run();

  const shopId = shopResult.meta.last_row_id;

  const email = body.admin_email.trim().toLowerCase();
  const existingAdmin = await env.DB.prepare("SELECT id FROM admins WHERE email = ?").bind(email).first();
  if (existingAdmin) {
    return error("An admin with that email already exists", 409);
  }

  const passwordHash = await hashPassword(body.admin_password);
  await env.DB.prepare(
    "INSERT INTO admins (shop_id, email, password_hash, role) VALUES (?, ?, ?, 'sub_admin')"
  )
    .bind(shopId, email, passwordHash)
    .run();

  return json({ id: shopId, slug: finalSlug, name: body.name.trim(), admin_email: email });
}
