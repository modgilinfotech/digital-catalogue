import { json, error, parseImages, getShopBySlug } from "../../_lib/db.js";

// GET /api/shop/:slug
export async function onRequestGet({ params, env }) {
  const shop = await getShopBySlug(env.DB, params.slug);
  if (!shop || !shop.is_active) {
    return error("Shop not found", 404);
  }

  const { results: categories } = await env.DB.prepare(
    "SELECT id, name, sort_order FROM categories WHERE shop_id = ? ORDER BY sort_order ASC, id ASC"
  )
    .bind(shop.id)
    .all();

  const { results: products } = await env.DB.prepare(
    "SELECT id, category_id, name, price, quantity_available, images FROM products WHERE shop_id = ? ORDER BY sort_order ASC, id DESC"
  )
    .bind(shop.id)
    .all();

  return json({
    shop: {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      logo_url: shop.logo_url,
      phone: shop.phone,
      address: shop.address,
      whatsapp_number: shop.whatsapp_number,
      instagram_url: shop.instagram_url,
      facebook_url: shop.facebook_url,
      other_social_url: shop.other_social_url,
    },
    categories,
    products: products.map((p) => ({ ...p, images: parseImages(p.images) })),
  });
}
