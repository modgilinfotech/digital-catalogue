// Small shared helpers used across Pages Functions.

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

export function error(message, status = 400) {
  return json({ error: message }, { status });
}

// Parses the JSON array stored in products.images, tolerating bad/empty data.
export function parseImages(raw) {
  try {
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Loads a shop row by slug, or null.
export async function getShopBySlug(db, slug) {
  return db.prepare("SELECT * FROM shops WHERE slug = ?").bind(slug).first();
}

export async function getShopById(db, id) {
  return db.prepare("SELECT * FROM shops WHERE id = ?").bind(id).first();
}
