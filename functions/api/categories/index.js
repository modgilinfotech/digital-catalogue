import { json, error } from "../../_lib/db.js";
import { requireAdmin, resolveShopId } from "../../_lib/auth.js";

// GET /api/categories?shop_id=  (super_admin can pass shop_id; sub_admin is locked to their own)
export async function onRequestGet({ request, env }) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const shopId = resolveShopId(session, url.searchParams.get("shop_id"));
  if (!shopId) return error("shop_id is required", 400);

  const { results } = await env.DB.prepare(
    "SELECT id, name, sort_order FROM categories WHERE shop_id = ? ORDER BY sort_order ASC, id ASC"
  )
    .bind(shopId)
    .all();

  return json({ categories: results });
}

// POST /api/categories  { shop_id?, name, sort_order? }
export async function onRequestPost({ request, env }) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const body = await request.json().catch(() => ({}));
  const shopId = resolveShopId(session, body.shop_id);
  if (!shopId) return error("shop_id is required", 400);
  if (!body.name || !body.name.trim()) return error("Category name is required", 400);

  const sortOrder = Number.isFinite(body.sort_order) ? body.sort_order : 0;

  const result = await env.DB.prepare(
    "INSERT INTO categories (shop_id, name, sort_order) VALUES (?, ?, ?)"
  )
    .bind(shopId, body.name.trim(), sortOrder)
    .run();

  return json({ id: result.meta.last_row_id, shop_id: shopId, name: body.name.trim(), sort_order: sortOrder });
}
