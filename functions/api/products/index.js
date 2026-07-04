import { json, error, parseImages } from "../../_lib/db.js";
import { requireAdmin, resolveShopId } from "../../_lib/auth.js";

// GET /api/products?shop_id=&category_id=
export async function onRequestGet({ request, env }) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const shopId = resolveShopId(session, url.searchParams.get("shop_id"));
  if (!shopId) return error("shop_id is required", 400);

  const categoryId = url.searchParams.get("category_id");
  let query = "SELECT * FROM products WHERE shop_id = ?";
  const bindings = [shopId];
  if (categoryId) {
    query += " AND category_id = ?";
    bindings.push(categoryId);
  }
  query += " ORDER BY sort_order ASC, id DESC";

  const { results } = await env.DB.prepare(query)
    .bind(...bindings)
    .all();

  return json({ products: results.map((p) => ({ ...p, images: parseImages(p.images) })) });
}

// POST /api/products  { shop_id?, category_id, name, price, quantity_available, images: [] }
export async function onRequestPost({ request, env }) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const body = await request.json().catch(() => ({}));
  const shopId = resolveShopId(session, body.shop_id);
  if (!shopId) return error("shop_id is required", 400);
  if (!body.name || !body.name.trim()) return error("Product name is required", 400);

  const price = Number(body.price) || 0;
  const quantity = Number.isFinite(body.quantity_available) ? Number(body.quantity_available) : 0;
  const images = JSON.stringify(Array.isArray(body.images) ? body.images : []);
  const categoryId = body.category_id || null;
  const sortOrder = Number.isFinite(body.sort_order) ? body.sort_order : 0;

  const result = await env.DB.prepare(
    `INSERT INTO products (shop_id, category_id, name, price, quantity_available, images, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(shopId, categoryId, body.name.trim(), price, quantity, images, sortOrder)
    .run();

  return json({
    id: result.meta.last_row_id,
    shop_id: shopId,
    category_id: categoryId,
    name: body.name.trim(),
    price,
    quantity_available: quantity,
    images: JSON.parse(images),
  });
}
