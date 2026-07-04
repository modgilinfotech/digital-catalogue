import { json } from "../../_lib/db.js";
import { clearSessionCookie } from "../../_lib/auth.js";

// POST /api/auth/logout
export async function onRequestPost() {
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
