// GET /api/images/:key  -- public, no auth (product photos are meant to be seen by shoppers)
export async function onRequestGet({ env, params }) {
  if (!env.PRODUCT_IMAGES) {
    return new Response("Image storage is not configured", { status: 500 });
  }

  const segments = Array.isArray(params.key) ? params.key : [params.key];
  const key = segments.map(decodeURIComponent).join("/");
  const object = await env.PRODUCT_IMAGES.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
