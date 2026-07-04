# Digital Catalogue

A multi-tenant product catalogue for small retail/wholesale shops. Shoppers browse
a mobile-first catalogue and order over WhatsApp; shop owners manage their own
products from a simple admin screen; you (the agency) onboard new shops from a
super-admin screen. Runs entirely on Cloudflare's free tier:

- **Cloudflare Pages** — static frontend (plain HTML/CSS/JS, no build step)
- **Cloudflare Pages Functions** — all backend API routes (`/functions`)
- **Cloudflare D1** — SQLite-compatible database
- **Cloudflare R2** — product image storage

No Node server, no external database, no paid image CDN.

## Project structure

```
public/                 Static frontend (deployed as-is, no build step)
  index.html             Public catalogue page (?shop=<slug>)
  admin/super/index.html Super-admin portal
  admin/shop/index.html  Shop (sub-admin) portal
  css/, js/, img/

functions/              Cloudflare Pages Functions (the backend)
  _middleware.js         Catches unhandled errors, returns clean JSON
  _lib/                  Shared helpers (auth, JWT, DB) — not routable
  api/shop/[slug].js      GET public shop + categories + products
  api/auth/               login / logout / me
  api/categories/         list/create, update/delete by id
  api/products/           list/create, update/delete by id
  api/upload.js           image upload -> R2
  api/images/[[key]].js   serves images out of R2
  api/admin/shops/        super-admin only: onboard/edit/delete shops

migrations/0001_init.sql D1 schema
seed.sql                 Demo data: 1 super-admin + 1 demo shop (Fashion Hub)
wrangler.toml             Pages + D1 + R2 bindings
```

## 1. Prerequisites

```bash
npm install -g wrangler       # or use `npx wrangler` for every command below
wrangler login
```

## 2. Create the D1 database

```bash
wrangler d1 create digital-catalogue-db
```

This prints a `database_id`. Copy it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "digital-catalogue-db"
database_id = "PASTE_YOUR_ID_HERE"
```

## 3. Create the R2 bucket

```bash
wrangler r2 bucket create digital-catalogue-images
```

The binding name (`PRODUCT_IMAGES`) is already set in `wrangler.toml` — no
further config needed for the free tier. (Product photos are served through
the `/api/images/:key` Pages Function, so the bucket does not need to be
public.)

## 4. Run the migration + seed data

Locally (for `wrangler pages dev`):

```bash
npm run db:migrate:local
npm run db:seed:local
```

Against your real (remote) database, once the project is deployed:

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

The seed script creates:
- A super-admin login: `admin@youragency.com` / `SuperSecret123!`
- A demo shop **Fashion Hub** (`/?shop=fashion-hub`) with 4 categories
  (Kurtis, Sarees, Jeans, Tops) and 9 sample products in ₹.
- A shop-owner login for that demo shop: `owner@fashionhub.example` / `FashionHub123!`

**Change both passwords after your first login** — see "Rotating passwords" below.

## 5. Set the JWT secret

Sessions are signed with an HMAC secret. Set a strong, random value:

```bash
wrangler pages secret put JWT_SECRET
```

For local development, copy `.dev.vars.example` to `.dev.vars` and put any
placeholder value in it (never commit `.dev.vars` — it's already gitignored).

## 6. Run it locally

```bash
npm install
npm run dev
```

This starts `wrangler pages dev`, serving the static site and Functions
together, backed by your local D1 + R2 emulation. Visit:
- `http://localhost:8788/?shop=fashion-hub` — public catalogue
- `http://localhost:8788/admin/shop/` — shop owner login
- `http://localhost:8788/admin/super/` — agency (super-admin) login

## 7. Deploy

```bash
wrangler pages deploy public
```

(Or `npm run deploy`, which runs the same command.) On first deploy, Wrangler
will ask you to create/link a Pages project — accept the defaults. Re-run the
same command any time you update the frontend or Functions.

After every deploy, make sure the D1 migration/seed has been applied to the
**remote** database (step 4) — Pages Functions in production always talk to
the remote D1 database, not your local one.

## How multi-tenancy works

Each shop has a unique `slug`. The public catalogue is a single static page
(`/`) that reads `?shop=<slug>` from the URL and fetches
`/api/shop/<slug>` for that shop's data — so every shop gets its own
shareable link, e.g. `https://your-project.pages.dev/?shop=fashion-hub`. Give
each client that link (and put it in their WhatsApp/Instagram bio).

If you'd prefer prettier per-shop paths (`/fashion-hub` instead of
`/?shop=fashion-hub`), you can add a `public/_redirects` rule once you know
your shop slugs, or point a custom subdomain at the same Pages project per
client — both are free-tier compatible, but aren't required for this to work.

## Rotating passwords

There's no self-serve "forgot password" flow (kept intentionally simple).
To set a new password for any admin, generate a new PBKDF2 hash using the
same scheme as `functions/_lib/auth.js` (`hashPassword`) and update the
`admins.password_hash` column directly with `wrangler d1 execute`, e.g.:

```bash
wrangler d1 execute digital-catalogue-db --remote \
  --command "UPDATE admins SET password_hash = '...' WHERE email = 'owner@fashionhub.example'"
```

## Notes on the free tier

- D1 free tier: 5GB storage, 5M rows read/day, 100K rows written/day — ample
  for a small catalogue.
- R2 free tier: 10GB storage, no egress fees — images are served through the
  Pages Function proxy so they're cached with long-lived `Cache-Control`
  headers.
- Client-side image compression (`public/js/compress.js`) resizes photos to a
  1200px max dimension and re-encodes as JPEG before upload, to keep storage
  and bandwidth well inside free-tier limits.
