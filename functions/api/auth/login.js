import { json, error } from "../../_lib/db.js";
import { verifyPassword, signJWT, sessionCookie } from "../../_lib/auth.js";

// POST /api/auth/login  { email, password }
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return error("Invalid request body", 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) return error("Email and password are required", 400);

  const admin = await env.DB.prepare("SELECT * FROM admins WHERE email = ?").bind(email).first();
  if (!admin) return error("Invalid email or password", 401);

  const ok = await verifyPassword(password, admin.password_hash);
  if (!ok) return error("Invalid email or password", 401);

  const token = await signJWT(
    { sub: admin.id, email: admin.email, role: admin.role, shop_id: admin.shop_id },
    env.JWT_SECRET
  );

  return json(
    { id: admin.id, email: admin.email, role: admin.role, shop_id: admin.shop_id },
    { headers: { "Set-Cookie": sessionCookie(token) } }
  );
}
