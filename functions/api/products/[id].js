import { json, error, parseImages } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";

async function loadOwnedProduct(env, session, id) {
  const product = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
  if (!product) return { error: error("Product not found", 404) };
  if (session.role !== "super_admin" && product.shop_id !== session.shop_id) {
    return { error: error("Forbidden", 403) };
  }
  return { product };
}

// R2 keys are stored as image URLs like /api/images/<key>; extract the key to delete.
function r2KeyFromUrl(url) {
  const match = /\/api\/images\/(.+)$/.exec(url || "");
  return match ? decodeURIComponent(match[1]) : null;
}

// PUT /api/products/:id  { category_id?, name?, price?, quantity_available?, images? }
export async function onRequestPut({ request, env, params }) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const { product, error: err } = await loadOwnedProduct(env, session, params.id);
  if (err) return err;

  const body = await request.json().catch(() => ({}));
  const name = body.name !== undefined ? body.name.trim() : product.name;
  const price = body.price !== undefined ? Number(body.price) : product.price;
  const quantity =
    body.quantity_available !== undefined ? Number(body.quantity_available) : product.quantity_available;
  const categoryId = body.category_id !== undefined ? body.category_id : product.category_id;
  const oldImages = parseImages(product.images);
  const newImages = body.images !== undefined ? body.images : oldImages;

  // Clean up any images that were removed from the array.
  if (body.images !== undefined && env.PRODUCT_IMAGES) {
    const removed = oldImages.filter((img) => !newImages.includes(img));
    for (const img of removed) {
      const key = r2KeyFromUrl(img);
      if (key) await env.PRODUCT_IMAGES.delete(key).catch(() => {});
    }
  }

  await env.DB.prepare(
    `UPDATE products SET category_id = ?, name = ?, price = ?, quantity_available = ?, images = ? WHERE id = ?`
  )
    .bind(categoryId, name, price, quantity, JSON.stringify(newImages), params.id)
    .run();

  return json({
    id: Number(params.id),
    category_id: categoryId,
    name,
    price,
    quantity_available: quantity,
    images: newImages,
  });
}

// DELETE /api/products/:id
export async function onRequestDelete({ request, env, params }) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const { product, error: err } = await loadOwnedProduct(env, session, params.id);
  if (err) return err;

  if (env.PRODUCT_IMAGES) {
    const images = parseImages(product.images);
    for (const img of images) {
      const key = r2KeyFromUrl(img);
      if (key) await env.PRODUCT_IMAGES.delete(key).catch(() => {});
    }
  }

  await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
