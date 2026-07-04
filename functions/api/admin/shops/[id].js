import { json, error } from "../../../_lib/db.js";
import { requireAdmin } from "../../../_lib/auth.js";

// GET /api/admin/shops/:id
export async function onRequestGet({ request, env, params }) {
  const session = await requireAdmin(request, env, "super_admin");
  if (session instanceof Response) return session;

  const shop = await env.DB.prepare("SELECT * FROM shops WHERE id = ?").bind(params.id).first();
  if (!shop) return error("Shop not found", 404);
  return json({ shop });
}

// PUT /api/admin/shops/:id
// { name?, logo_url?, phone?, address?, whatsapp_number?, instagram_url?, facebook_url?, other_social_url?, is_active? }
export async function onRequestPut({ request, env, params }) {
  const session = await requireAdmin(request, env, "super_admin");
  if (session instanceof Response) return session;

  const shop = await env.DB.prepare("SELECT * FROM shops WHERE id = ?").bind(params.id).first();
  if (!shop) return error("Shop not found", 404);

  const body = await request.json().catch(() => ({}));
  const merged = {
    name: body.name !== undefined ? body.name.trim() : shop.name,
    logo_url: body.logo_url !== undefined ? body.logo_url : shop.logo_url,
    phone: body.phone !== undefined ? body.phone : shop.phone,
    address: body.address !== undefined ? body.address : shop.address,
    whatsapp_number: body.whatsapp_number !== undefined ? body.whatsapp_number : shop.whatsapp_number,
    instagram_url: body.instagram_url !== undefined ? body.instagram_url : shop.instagram_url,
    facebook_url: body.facebook_url !== undefined ? body.facebook_url : shop.facebook_url,
    other_social_url: body.other_social_url !== undefined ? body.other_social_url : shop.other_social_url,
    is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : shop.is_active,
  };

  await env.DB.prepare(
    `UPDATE shops SET name = ?, logo_url = ?, phone = ?, address = ?, whatsapp_number = ?,
     instagram_url = ?, facebook_url = ?, other_social_url = ?, is_active = ? WHERE id = ?`
  )
    .bind(
      merged.name,
      merged.logo_url,
      merged.phone,
      merged.address,
      merged.whatsapp_number,
      merged.instagram_url,
      merged.facebook_url,
      merged.other_social_url,
      merged.is_active,
      params.id
    )
    .run();

  return json({ id: Number(params.id), ...merged });
}

// DELETE /api/admin/shops/:id  -- permanently removes the shop and all its data (cascade)
export async function onRequestDelete({ request, env, params }) {
  const session = await requireAdmin(request, env, "super_admin");
  if (session instanceof Response) return session;

  const shop = await env.DB.prepare("SELECT * FROM shops WHERE id = ?").bind(params.id).first();
  if (!shop) return error("Shop not found", 404);

  if (env.PRODUCT_IMAGES) {
    const { results: products } = await env.DB.prepare(
      "SELECT images FROM products WHERE shop_id = ?"
    )
      .bind(params.id)
      .all();
    for (const p of products) {
      let images = [];
      try {
        images = JSON.parse(p.images || "[]");
      } catch {
        images = [];
      }
      for (const img of images) {
        const match = /\/api\/images\/(.+)$/.exec(img || "");
        if (match) await env.PRODUCT_IMAGES.delete(match[1]).catch(() => {});
      }
    }
  }

  await env.DB.batch([
    env.DB.prepare("DELETE FROM products WHERE shop_id = ?").bind(params.id),
    env.DB.prepare("DELETE FROM categories WHERE shop_id = ?").bind(params.id),
    env.DB.prepare("DELETE FROM admins WHERE shop_id = ?").bind(params.id),
    env.DB.prepare("DELETE FROM shops WHERE id = ?").bind(params.id),
  ]);

  return json({ ok: true });
}
