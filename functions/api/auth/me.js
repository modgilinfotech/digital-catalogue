import { json, error, getShopById } from "../../_lib/db.js";
import { getSession } from "../../_lib/auth.js";

// GET /api/auth/me
export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  if (!session) return error("Not authenticated", 401);

  let shop = null;
  if (session.shop_id) {
    shop = await getShopById(env.DB, session.shop_id);
  }

  return json({
    email: session.email,
    role: session.role,
    shop_id: session.shop_id,
    shop_name: shop ? shop.name : null,
    shop_slug: shop ? shop.slug : null,
  });
}
