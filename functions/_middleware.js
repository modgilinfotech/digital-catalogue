// Applies to every request under /functions. Cloudflare Pages Functions runs
// this before the matching route handler, and lets us catch anything that
// throws so shoppers/admins never see a raw stack trace.
export async function onRequest({ request, next }) {
  try {
    return await next();
  } catch (err) {
    console.error("Unhandled error:", err);
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw err;
  }
}
