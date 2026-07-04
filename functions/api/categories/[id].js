import { json, error } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/auth.js";

async function loadOwnedCategory(env, session, id) {
  const category = await env.DB.prepare("SELECT * FROM categories WHERE id = ?").bind(id).first();
  if (!category) return { error: error("Category not found", 404) };
  if (session.role !== "super_admin" && category.shop_id !== session.shop_id) {
    return { error: error("Forbidden", 403) };
  }
  return { category };
}

// PUT /api/categories/:id  { name?, sort_order? }
export async function onRequestPut({ request, env, params }) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const { category, error: err } = await loadOwnedCategory(env, session, params.id);
  if (err) return err;

  const body = await request.json().catch(() => ({}));
  const name = body.name !== undefined ? body.name.trim() : category.name;
  const sortOrder = body.sort_order !== undefined ? Number(body.sort_order) : category.sort_order;

  await env.DB.prepare("UPDATE categories SET name = ?, sort_order = ? WHERE id = ?")
    .bind(name, sortOrder, params.id)
    .run();

  return json({ id: Number(params.id), name, sort_order: sortOrder });
}

// DELETE /api/categories/:id
export async function onRequestDelete({ request, env, params }) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const { error: err } = await loadOwnedCategory(env, session, params.id);
  if (err) return err;

  await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
