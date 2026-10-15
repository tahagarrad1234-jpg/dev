# AMAL Watches — Full Project Audit, Improvement Prompts & 20 Feature Tasks

> Scanned: `dev-76b040b…zip` (120 files, pnpm monorepo: `apps/api` + `apps/web`)
> Scope: every source, config, schema, and doc file was read. Nothing was executed (no network in the sandbox), so runtime behaviour is inferred from code.

---

## Table of contents

1. [Project snapshot](#1-project-snapshot)
2. [What is real vs. mocked](#2-what-is-real-vs-mocked)
3. [Findings, by priority](#3-findings-by-priority)
4. [Ready-to-paste improvement prompts](#4-ready-to-paste-improvement-prompts)
5. [20 important features, as tasks](#5-20-important-features-as-tasks)
6. [Suggested roadmap](#6-suggested-roadmap)

---

## 1. Project snapshot

**AMAL** is a premium watch e-commerce storefront with a customer login, an admin panel, and a checkout flow. UI copy is in Spanish.

| Area | Technology |
|---|---|
| Monorepo | pnpm workspaces (`apps/*`), TypeScript 5.9, Node 24 |
| Frontend | React 19, Vite 7, Tailwind 4, wouter, TanStack Query, Radix/shadcn (10 components kept), lucide-react |
| Backend | Express 5, pino, zod, cookie-parser, cors, esbuild bundle |
| Data | Supabase (auth + `amal_users` / `amal_sessions`) **and** Drizzle ORM + `pg` (7 tables) |
| Deploy | `vercel.json` (frontend only) + leftover Replit config |

```
apps/
  api/   src/{app,index}.ts  modules/{auth,health}  lib/auth-store.ts  db/{schema,seed}  config/  middlewares/
  web/   src/{app,features,pages,components,lib,hooks,styles,types}
```

**Only 6 API endpoints exist:** `GET /api/healthz`, `POST /api/auth/{register,login,admin/login,logout}`, `GET /api/auth/me`.
There are no endpoints for products, orders, favorites, or newsletter.

---

## 2. What is real vs. mocked

| Feature | State |
|---|---|
| Browsing the catalogue, search, filter, sort | Works, but from a **hardcoded array** in the frontend |
| Cart | Works in memory, **lost on refresh** |
| Favorites | Local state only, **lost on refresh**, never sent to the server |
| Login / register / logout | Works (with serious security issues, see §3) |
| Checkout | **UI only**. Submit just shows "Pedido recibido". No order is created, no payment, no stock change |
| Newsletter | Button only shows a toast. Nothing is stored |
| Admin dashboard | **100% mocked**: hardcoded orders, "286 clientes", "+18.4%", "MARTES, 18 DE JUNIO", stock "42". Edits are lost on refresh |
| Admin "Exportar CSV", "Guardar cambios" | Fake toasts |
| Database (Drizzle schema, seed) | Defined but **never connected** to the API |

---

## 3. Findings, by priority

### 🔴 Critical — fix before any real user touches this

| # | Finding | Where |
|---|---|---|
| C1 | **Default admin credentials hardcoded as fallback** (`admin@amal.local` / `admin1234`) in code **and** in `.env.example`. If env vars are missing in production, anyone can log in as admin. | `lib/auth-store.ts` (`initDefaultAdmin`, `authenticateUser`), `.env.example` |
| C2 | **Passwords stored and compared in plain text** in the in-memory store (`passwordHash: password`, `=== password`). Name says "hash" but nothing is hashed. Comparison is not constant-time. | `lib/auth-store.ts` |
| C3 | **Silent `catch {}` everywhere** around Supabase calls. A failed Supabase insert still returns "success" and the user exists only in RAM. On restart or on Vercel/serverless (stateless) users and sessions disappear. | `createUser`, `createSession`, `userFromSession`, `deleteSession` |
| C4 | **Contradictory architecture:** `index.ts` refuses to boot without Supabase, yet the whole auth layer is built around an in-memory fallback. Two sources of truth that can diverge. | `index.ts` vs `auth-store.ts` |
| C5 | **Checkout collects raw card number + CVC in plain inputs** with no payment provider and no validation, then claims "AMAL never stores them". It stores nothing because it does nothing. Must be replaced with Stripe (or similar) so card data never touches your code. | `features/orders/checkout.tsx` |
| C6 | **Admin protection is client-side only.** `/admin` checks `/auth/me` in the browser, but there are no admin API routes or role middleware. When you add admin endpoints they will be unprotected unless you build server-side guards. | `protected-admin.tsx` |
| C7 | **No rate limiting, no `helmet`, no brute-force protection** on login / register / admin login. | `app.ts` |
| C8 | **Session tokens are stored raw** in `amal_sessions`. A DB leak = every active session hijackable. Store a SHA-256 hash instead. | `auth-store.ts`, `supabase-schema.sql` |

### 🟠 High — real bugs and structural problems

| # | Finding | Where |
|---|---|---|
| H1 | **`errorHandler` is written but never registered** in `app.ts`, so zod errors and thrown errors fall back to Express defaults. | `middlewares/error-handler.ts`, `app.ts` |
| H2 | **`config/index.ts` is never imported.** It also defaults `JWT_SECRET` to `"super-secret-jwt-key"`. The code reads `process.env` directly in 6+ places instead. | `config/index.ts` |
| H3 | **Drizzle is disconnected and misconfigured.** `drizzle.config.ts` points to `./src/schema` but the schema lives in `./src/db/schema`, so `db:push` will find nothing. `db/index.ts` is imported only by `seed.ts`. `ssl: { rejectUnauthorized: false }` disables certificate checks. | `drizzle.config.ts`, `db/index.ts` |
| H4 | **Schema bug:** `amalOrderItems.productId` is `serial()` (auto-increment) instead of `integer()`. It will generate fake IDs instead of referencing the product. | `db/schema/orders.ts` |
| H5 | **Status enums disagree:** DB allows `Pago / Preparando / Enviado`; the frontend type adds `Entregado`. No cancelled/refunded state exists. | `orders.ts` vs `types/index.ts` |
| H6 | **Two schema systems:** `supabase-schema.sql` creates only 2 tables; the Drizzle schema defines 7. Supabase auth user IDs are UUIDs, while `amal_users.id` is free `text`. | both |
| H7 | **Product data is copy-pasted 3 times** (`web/lib/data.ts`, `web/lib/api.ts`, `api/db/seed.ts`). `data.ts` has no `stock`; `api.ts` does. Types are also duplicated (`data.ts` vs `types/index.ts`), as is `money()` (`data.ts` vs `utils.ts`). | web + api |
| H8 | **Dead code: the real app doesn't use its own architecture.** `Home` keeps its own cart, favorites and header. These are never imported: `CartProvider`/`useCart` (it's mounted but unused), `Header`, `Footer`, `AnnouncementBar`, `useAuth`, `lib/api.ts`, `lib/supabase.ts`, `use-toast` toasts. `createOrder` and `subscribeNewsletter` are never called. | `home.tsx`, `lib/*` |
| H9 | **Fragile checkout trigger:** a global `document.addEventListener("click")` looks for `data-testid="button-checkout"` to open checkout. Test IDs are being used as application logic. | `home.tsx` |
| H10 | **Auth API URL defaults to `http://localhost:4000/api`**, bypassing the Vite proxy. In production, without `VITE_API_URL`, login fails; cross-origin cookies also need `SameSite=None; Secure`, and the code uses `lax`. | `lib/auth-api.ts`, `auth/index.ts` |
| H11 | **Vercel config is incomplete:** it builds only the frontend (no API deploy), and has **no SPA rewrite**, so refreshing `/login`, `/register` or `/admin` returns 404. | `vercel.json` |
| H12 | **Admin navigation is broken:** "Volver a la tienda" uses `href="#/"` (hash routing) while the app uses path routing (wouter), so it stays on `/admin`. The redirect `window.location.href = …` is also executed **during render**. | `protected-admin.tsx` |
| H13 | **Order model can't be trusted:** the client sends `total` and a random `AM-####` id (`createOrder`). The server must compute prices, totals and ids. Random 4-digit ids will collide. | `lib/api.ts` |
| H14 | **Destructive seed:** `seed.ts` deletes all products on every run. Fine for dev, dangerous if run against production `DATABASE_URL`. | `db/seed.ts` |

### 🟡 Medium — quality, DX, maintainability

| # | Finding |
|---|---|
| M1 | **Zero tests, no ESLint, no Prettier config, no CI** (Prettier is installed but unconfigured). |
| M2 | **Two lockfiles** (`package-lock.json` and `pnpm-lock.yaml`) while `packageManager` is pnpm. Delete `package-lock.json`. |
| M3 | **Windows-only native packages pinned** in `apps/web` devDependencies (`@esbuild/win32-x64`, `@rollup/rollup-win32-x64-msvc`, `lightningcss-win32-x64-msvc`) while the workspace overrides remove them for other platforms. This is inconsistent and risky on Linux/Vercel. |
| M4 | **`CLEANUP_REPORT.md` says unused UI was removed, but `package.json` still lists ~25 unused Radix packages** + `recharts`, `cmdk`, `embla-carousel-react`, `vaul`, `react-day-picker`, `input-otp`, `next-themes`, `sonner`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `react-icons`. Also, the report refers to `artifacts/…` paths that no longer exist. |
| M5 | **Replit leftovers:** `replit.md` is an unfilled template that mentions packages that don't exist (`@workspace/api-server`, `@workspace/db`, `@workspace/api-spec`, port 5000). `.replit` references a missing `scripts/post-merge.sh`. `pnpm-workspace.yaml` mentions `expo`, `stripe-replit-sync`, and pins React with "because expo requires it". `.gitignore` references `artifacts/api-server/data/`. Root `package.json` depends on `@replit/connectors-sdk` and `@supabase/supabase-js` without using them at root level. |
| M6 | **`README.md` is just `# dev`.** No setup, no env docs, no architecture. |
| M7 | **Monolith files:** `home.tsx` (661 lines), `protected-admin.tsx` (556 lines), single `components.css` (1,920 lines / 53 KB). |
| M8 | **Mixed languages in the UI:** Spanish UI with English fragments ("Mide el tiempo *beautifully*", "The pleasure is *en la elección*", category values `Dress/Field/Diver`, English aria-labels, French `favoris`, `Avis de livraison`). The page title/description still say "Premium Watch Shop — built on Replit. Update this description…" with `lang="en"`. |
| M9 | **Currency/market mismatch:** Spanish copy, `+34` placeholders and an ES-based owner, but prices are in USD and checkout ships only to US/CA/GB/CH/JP. Spain and the EU are missing; no VAT/IVA. |
| M10 | **Accessibility:** viewport has `maximum-scale=1` (blocks pinch zoom); favorite buttons use English aria-labels; no skip link; no focus management in cart/checkout overlays. |
| M11 | **Pexels hotlinks**, one of them a photo literally slugged `rolex-watch-time-luxury` used for a different brand. This is a brand/IP risk and a hotlink-reliability risk. Host your own optimised images. |
| M12 | **Password policy** is only `min(8)`. No email verification, no password reset (the "forgot password" link is a `mailto:`). |
| M13 | Expired sessions are never purged; there's an index on `expires_at` but no cleanup job. |
| M14 | **Express `trust proxy` not set** (matters for secure cookies and rate-limit IPs behind Vercel/Replit). No graceful shutdown. No request-size limit on `express.json()`. |

### 🟢 Low

- `findUserByEmail` result `user` in `/auth/admin/login` is unused.
- `ensureAdmin()` is an async function that does nothing but call a sync function.
- `useAuth` types the user without `name`; each component calls `/auth/me` again (no shared state).
- `Footer` text/contact email differs between `footer.tsx` (`atelier@…`) and `home.tsx` (`info@…`).
- `new QueryClient()` is created but TanStack Query is never used.
- No 404 handler for `/api/*`; no API versioning (`/api/v1`).

---

## 4. Ready-to-paste improvement prompts

Paste **Prompt 0** first in a fresh session (Claude Code, Cursor, Copilot, Replit Agent…), then run the numbered prompts **one at a time, in order**. Each prompt is self-contained and ends with verification steps.

### Prompt 0 — Shared context (always paste first)

```text
You are a senior full-stack engineer working on "AMAL Watches", a premium watch
e-commerce site. Monorepo (pnpm workspaces): apps/api (Express 5, TypeScript, zod,
pino, Supabase JS, Drizzle ORM + pg) and apps/web (React 19, Vite 7, Tailwind 4,
wouter, TanStack Query). UI language is Spanish; market is Spain/EU; currency EUR.

Rules for every task:
- Read the relevant files before editing. Do not invent file paths.
- Make small, reviewable changes. Keep TypeScript strict-friendly (no `any`).
- Never hardcode secrets or default credentials. All config comes from env,
  validated once at startup with zod, in apps/api/src/config/index.ts.
- Never swallow errors with empty catch blocks. Log with pino and return a
  correct HTTP status.
- After each task run `pnpm run typecheck` and `pnpm run build` and fix all errors.
- Finish with: (1) a list of files changed, (2) how to test manually,
  (3) any follow-up risks. Do not add features I did not ask for.
```

### Prompt 1 — Fix authentication & remove security holes (do this first)

```text
Task: rewrite the authentication layer in apps/api to be secure and use ONE source
of truth (Supabase). Context: apps/api/src/lib/auth-store.ts currently has an
in-memory fallback, plain-text password comparison, hardcoded default admin
(admin@amal.local / admin1234), and silent `catch {}` blocks.

Do the following:
1. Delete the in-memory users/sessions maps and the hardcoded default admin.
   Remove ADMIN_PASSWORD fallback logic. Admin is a normal user whose role is set
   to 'admin' in the database (provide a one-off script `pnpm --filter @workspace/api
   run create-admin -- <email>` that promotes an existing user, and document it).
2. Use Supabase Auth for password verification (signUp / signInWithPassword).
   Never store or compare passwords in our code.
3. Sessions: generate a 32-byte random token, store only its SHA-256 hash in
   amal_sessions, send the raw token in an httpOnly cookie. Add `sessions` cleanup
   (delete expired rows on login + a periodic job). Cookie: httpOnly, secure in
   production, sameSite 'lax' (or 'none'+secure if the web app is on another domain),
   path '/'. Set `app.set('trust proxy', 1)`.
4. Errors: remove every empty catch. If Supabase fails, log it and return 503/500;
   never pretend success.
5. Create `requireAuth` and `requireAdmin` middlewares in apps/api/src/middlewares/
   (read cookie -> resolve user -> 401/403). Use them on all non-public routes.
6. Add `helmet`, `express-rate-limit` (strict on /auth/login, /auth/register,
   /auth/admin/login: e.g. 10 requests / 15 min / IP+email), `express.json({limit:'100kb'})`.
7. Register the existing errorHandler in app.ts AFTER the routes, add a JSON 404
   handler for /api/*, and make errorHandler hide internal messages in production.
8. Make apps/api/src/config/index.ts the only place that reads process.env
   (zod-validated, required vars fail fast, no default secrets). Use it everywhere.
   Remove JWT_SECRET if unused. Update .env.example (no real-looking passwords).
9. Update supabase-schema.sql so amal_users.id is uuid referencing auth.users(id),
   sessions store token_hash, and RLS stays enabled.
10. Password policy: min 10 chars; reject common passwords. Return generic
    "invalid credentials" messages (no user enumeration).

Acceptance: login/register/logout/me work against a real Supabase project; wrong
password gives 401; 11th attempt in the window gives 429; restarting the API does
NOT log users out; `grep -r "admin1234"` returns nothing; typecheck + build pass.
```

### Prompt 2 — Unify the data layer (Drizzle ↔ Supabase Postgres)

```text
Task: make the database layer consistent. Currently there are two schema systems
(supabase-schema.sql with 2 tables, Drizzle schema with 7 tables), drizzle.config.ts
points to the wrong path (./src/schema instead of ./src/db/schema), orders.ts uses
serial() for amalOrderItems.productId (should be integer), and status enums
differ between API and web.

Do the following:
1. Choose Drizzle as the single schema source for ALL tables (users, sessions,
   products, orders, order_items, favorites, newsletter). Fix drizzle.config.ts
   (schema path, `out: ./drizzle`), generate real migrations with drizzle-kit
   (`db:generate`, `db:migrate`) and delete the hand-written duplicate SQL
   (keep only RLS statements in a migration file).
2. Fix schema bugs: productId -> integer(); add order status enum
   ['pending','paid','preparing','shipped','delivered','cancelled','refunded'];
   store money as integer cents (price_cents) to avoid float errors; add
   `slug` (unique), `is_published`, `updated_at` to products; add
   `stripe_payment_intent_id` and `shipping_cents`, `tax_cents` to orders;
   snapshot product name/price in order_items (already there) and add CHECK
   constraints (quantity > 0, stock >= 0).
3. db/index.ts: remove `rejectUnauthorized:false`; use proper SSL config from env
   (`DATABASE_SSL=require`), export a typed `db`, and add graceful pool shutdown.
4. Make the seed idempotent (upsert by slug) and refuse to run when
   NODE_ENV=production unless `--force` is passed. Move product data to ONE place:
   apps/api/src/db/seed-data.ts.
5. Share types: create `packages/shared` (or `apps/api/src/contracts`) with zod
   schemas + inferred types for Product, Order, OrderStatus, User, and import them
   in BOTH apps. Delete duplicated types in apps/web/src/lib/data.ts and
   apps/web/src/types/index.ts.

Acceptance: `pnpm --filter @workspace/api db:generate && db:migrate && seed` works
on a fresh database; typecheck passes in both apps; no duplicated product arrays remain.
```

### Prompt 3 — Build the missing backend API (products, orders, favorites, newsletter)

```text
Task: implement the REST API that the frontend already expects but the backend
lacks. Create modules under apps/api/src/modules/ following the existing
module pattern (router + service + zod schemas):

- products:   GET /api/products (query: category, q, minPrice, maxPrice, sort,
              page, pageSize), GET /api/products/:slug,
              admin only: POST/PATCH/DELETE /api/admin/products (requireAdmin).
- orders:     POST /api/orders (public/auth optional), GET /api/orders/me,
              GET /api/orders/:id (owner or admin),
              admin: GET /api/admin/orders, PATCH /api/admin/orders/:id/status.
- favorites:  GET/PUT/DELETE /api/favorites/:productId (requireAuth).
- newsletter: POST /api/newsletter (double opt-in token), GET /api/newsletter/confirm,
              GET /api/newsletter/unsubscribe.
- admin:      GET /api/admin/stats (revenue, orders, avg order value, low stock,
              customers) computed from real data.

Critical rules:
- The CLIENT NEVER sends prices, totals or order ids. POST /api/orders accepts only
  [{productId, quantity}] + shipping/contact data; the server loads prices from the DB,
  computes subtotal/shipping/tax/total, and generates the order id (e.g. AM-2026-000123
  from a DB sequence).
- Create the order and decrement stock inside ONE transaction with row locking
  (SELECT ... FOR UPDATE) so two buyers can't purchase the last watch. Return 409
  with a clear message when stock is insufficient.
- Validate every body/query with zod; return 400 with field errors.
- Use requireAdmin on all /api/admin/* routes. Add pagination everywhere.
- Add an OpenAPI description (zod-to-openapi) or at least a docs/API.md.

Acceptance: curl examples for every endpoint in docs/API.md; concurrent order test
cannot oversell; non-admin gets 403 on /api/admin/*; typecheck + build pass.
```

### Prompt 4 — Connect the frontend to the API and remove duplication

```text
Task: refactor apps/web so the real app uses its own architecture. Today Home keeps
its own cart/favorites/header state; CartProvider, Header, Footer, AnnouncementBar,
useAuth, lib/api.ts and lib/supabase.ts are unused; products are hardcoded.

Do the following:
1. Fetch products with TanStack Query (`useProducts`, `useProduct`) from /api/products.
   Delete the hardcoded arrays in lib/data.ts and lib/api.ts, and the localStorage
   fallbacks. Show skeleton loaders and an error state with retry.
2. Use ONE cart implementation: CartProvider/useCart, persisted to localStorage
   (versioned key), re-validated against the API on load (price/stock changed?),
   cleared only after a confirmed order. Remove the duplicate cart in Home.
3. Replace the document-level click listener hack that looks for
   data-testid="button-checkout" with a normal onClick handler / route (/checkout).
4. Create an AuthProvider (context + React Query) used by Header, admin guard, and
   checkout. Fix useAuth to include `name`. Remove duplicate /auth/me calls.
5. Use the shared Header/Footer/AnnouncementBar components in all pages. Delete
   duplicates inside home.tsx and the unused ones if truly obsolete.
6. Split home.tsx (661 lines) and protected-admin.tsx (556 lines) into small
   components: Hero, Manifesto, CollectionGrid, ProductCard, CartDrawer, Newsletter,
   Footer; AdminLayout, AdminOverview, AdminOrders, AdminCatalog, AdminCustomers, AdminSettings.
7. Routing: add real routes /product/:slug, /checkout, /account, /favorites. Fix the
   admin links that use `#/` (use wouter <Link href="/">), and move the
   redirect-in-render into a <Redirect/> component or useEffect.
8. Set VITE_API_URL default to "/api" (use the Vite proxy in dev) and add
   `rewrites` to vercel.json for SPA fallback (and /api -> API deployment).
9. Remove duplicate `money()`; format with Intl.NumberFormat('es-ES', {currency:'EUR'}).

Acceptance: no hardcoded product arrays in web; refreshing /login, /admin, /checkout
works in production build; cart survives refresh; typecheck + build pass.
```

### Prompt 5 — Real checkout with Stripe (no card data on our servers)

```text
Task: replace the fake checkout with Stripe. Currently checkout.tsx has raw card
number/expiry/CVC inputs and just calls setSubmitted(true).

Do the following:
1. Remove ALL raw card inputs. Use Stripe Checkout (hosted) or Stripe Payment Element.
2. API: POST /api/checkout/session -> validates cart server-side (prices/stock from
   DB), creates a pending order, creates the Stripe session with
   automatic_tax or a computed tax line, shipping options by country, and returns
   the URL. Use an idempotency key.
3. POST /api/webhooks/stripe (raw body, signature verified with
   STRIPE_WEBHOOK_SECRET): on checkout.session.completed mark the order 'paid',
   store payment_intent id, decrement stock if not already reserved, send
   confirmation email; on expired/failed release the stock reservation.
   Webhook handlers MUST be idempotent.
4. Frontend: validate the form with react-hook-form + zod; add the countries of the EU
   (ES default), postal code validation per country, an order-summary with
   shipping + IVA (21% for ES) lines, and a success page /checkout/success?order=
   that reads the order from the API (not from client state).
5. Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY added to
   config + .env.example. Never log card or secret data.

Acceptance: test card 4242 4242 4242 4242 completes an order; refresh on the
success page still works; replaying the same webhook doesn't double-decrement stock;
cancelling payment releases stock.
```

### Prompt 6 — Make the admin panel real

```text
Task: replace the mocked data in apps/web/src/features/admin with real API data.

1. Overview: use GET /api/admin/stats (revenue, orders, AOV, customers, low-stock
   count, % change vs previous period). Remove hardcoded "286", "+18.4%", the
   hardcoded date "MARTES, 18 DE JUNIO" (use today's date) and the fake stock bars.
2. Orders: server-side search, status filter, pagination, status change that
   persists (PATCH), order detail drawer (items, address, payment status), real CSV
   export (stream from the API, escape formulas like =,+,-,@ to prevent CSV injection).
3. Catalog: create/edit/delete products with a form (zod validation), image upload
   to Supabase Storage (jpeg/png/webp, max 5 MB, server-checked), publish toggle,
   stock field, and confirmation dialog on delete (soft delete if the product has orders).
4. Customers: list from DB with order count + lifetime spend.
5. Settings: store the settings in a `store_settings` table (shop name, contact
   email, currency, free-shipping threshold) and make the storefront read them.
6. Enforce permissions on the server (requireAdmin); the frontend guard is UX only.
7. Add an audit log table (who changed what and when) for products, orders, settings.

Acceptance: every admin action persists after refresh; non-admin API calls get 403;
no hardcoded business numbers remain in protected-admin*.tsx.
```

### Prompt 7 — Repo cleanup, tooling, tests and CI

```text
Task: clean the repository and add quality tooling.

1. Delete package-lock.json (pnpm only). Remove the win32-only pinned packages
   (@esbuild/win32-x64, @rollup/rollup-win32-x64-msvc, lightningcss-win32-x64-msvc)
   from apps/web/package.json. Remove unused dependencies (run `depcheck` / `knip`):
   unused @radix-ui/*, recharts, cmdk, embla-carousel-react, vaul, react-day-picker,
   input-otp, next-themes, sonner, react-icons, date-fns (keep what is used).
   Remove @replit/connectors-sdk and the unused root @supabase/supabase-js.
2. Remove Replit leftovers or keep them in a clearly marked section: fix .replit
   (missing scripts/post-merge.sh), delete replit.md or fill it, remove expo/stripe-
   replit-sync comments from pnpm-workspace.yaml, fix .gitignore stale paths.
3. Rewrite README.md: what AMAL is, architecture diagram, prerequisites, env vars
   table, setup (`pnpm i`, db migrate, seed, dev), scripts, deployment, and
   troubleshooting. Update CLEANUP_REPORT.md or archive it under docs/.
4. Add ESLint (typescript-eslint + react-hooks + jsx-a11y), Prettier config,
   lint-staged + husky pre-commit.
5. Tests: Vitest for API services (auth, orders pricing, stock transaction) with
   Supertest; React Testing Library for cart, checkout form, protected admin;
   Playwright e2e: browse -> add to cart -> checkout (Stripe test) -> admin sees order.
6. GitHub Actions: install (frozen lockfile) -> lint -> typecheck -> test -> build,
   plus `pnpm audit --prod` and Dependabot/Renovate.
7. Add Dockerfile (api) + docker-compose for local Postgres, and a single
   `.env.example` per app with comments. Add a `/api/healthz` that also pings the DB
   (and a `/readyz`).

Acceptance: fresh clone -> README steps work; CI is green; `pnpm lint` passes.
```

### Prompt 8 — Language, content, accessibility, SEO

```text
Task: make the storefront consistent, accessible and discoverable.

1. i18n: introduce react-i18next (es default, en, fr). Move ALL strings out of
   components. Fix mixed-language copy ("beautifully", "The pleasure is en la
   elección", English category labels, French aria text). Add a language switcher
   and persist the choice.
2. index.html: real title/description (remove "built on Replit..."), set lang from the
   active language, canonical URL, Open Graph/Twitter images, theme-color.
   Remove `maximum-scale=1` from the viewport tag.
3. Add per-page <title>/meta (react-helmet-async), sitemap.xml and a real robots.txt,
   JSON-LD Product schema on product pages, and Organization schema on home.
4. Accessibility pass (WCAG 2.2 AA): skip link, visible focus states, focus trap +
   Esc in cart drawer/checkout/dialog, aria-live for notices, labels on all inputs,
   contrast check on the ink/bone/oxblood tokens, `prefers-reduced-motion` for the
   ticker and reveal animations, correct alt text for product images.
5. Performance: host optimised images yourself (WebP/AVIF, srcset, width/height,
   lazy loading) instead of Pexels hotlinks; replace the Rolex-labelled photo; split
   components.css by feature; code-split admin routes with React.lazy; self-host the
   Inter font. Target Lighthouse >= 90 on mobile.

Acceptance: Lighthouse a11y >= 95, SEO >= 95; axe shows no critical issues; UI has
no mixed-language strings.
```

---

## 5. 20 important features, as tasks

Legend: **Priority** P0 = must have to sell · P1 = important · P2 = growth.
**Effort** S ≈ 1–2 days · M ≈ 3–5 days · L ≈ 1–2 weeks.
Each task has acceptance criteria you can tick off. Tasks marked with a *Prompt* reference reuse §4.

### A. Commerce core (P0)

#### F01 — Products API and database-driven catalogue
- **Priority:** P0 · **Effort:** M · **Depends on:** Prompts 1–3
- Move the 6 hardcoded watches to the `amal_products` table; serve them from `GET /api/products` and `GET /api/products/:slug`.
- [ ] Storefront reads only from the API (no hardcoded arrays)
- [ ] Products have `slug`, `is_published`, price in cents, stock
- [ ] Loading skeletons and error/retry state

#### F02 — Secure orders API (server-side pricing + stock safety)
- **Priority:** P0 · **Effort:** M · **Depends on:** F01
- Client sends only `{productId, quantity}`; server computes totals and generates order IDs (DB sequence, no random IDs).
- [ ] Order + stock decrement in a single transaction with row locking
- [ ] 409 error when stock is insufficient
- [ ] Concurrency test proves the last watch can't be oversold

#### F03 — Real payments with Stripe + webhooks
- **Priority:** P0 · **Effort:** L · **Depends on:** F02 · *Prompt 5*
- Replace raw card inputs with Stripe Checkout / Payment Element; add Apple Pay / Google Pay and SEPA for the EU.
- [ ] No card data touches your servers
- [ ] Idempotent webhook marks orders paid / failed / expired
- [ ] Success page loads the order from the API, not from client state

#### F04 — Persistent cart (guest + logged-in)
- **Priority:** P0 · **Effort:** S · **Depends on:** F01
- Persist the cart in `localStorage` for guests; sync to the server for logged-in users and merge on login.
- [ ] Cart survives refresh and browser restart
- [ ] On load, prices/stock are re-validated and the user is told about changes
- [ ] Quantity capped to available stock

#### F05 — Product detail page
- **Priority:** P0 · **Effort:** M · **Depends on:** F01
- Route `/product/:slug` with image gallery + zoom, specs table (movement, case size, water resistance, strap, warranty), stock badge, add-to-cart, share link, "you may also like".
- [ ] Shareable URL with its own title/OG tags
- [ ] "Only 3 left" urgency badge using real stock
- [ ] Mobile-first gallery (swipe)

### B. Money, shipping & compliance (P0)

#### F06 — Shipping zones, IVA/VAT and EUR / multi-currency
- **Priority:** P0 · **Effort:** M · **Depends on:** F02
- Fix the US-only country list: add Spain + EU + UK/CH/US with per-zone rates, free-shipping threshold, and 21% IVA for Spain (OSS rules for EU B2C). Default currency EUR with a display currency switcher.
- [ ] Checkout shows subtotal, shipping, tax and total as separate lines
- [ ] Shipping rules editable from admin settings
- [ ] Prices consistently formatted with `Intl.NumberFormat`

#### F07 — GDPR, legal pages and cookie consent
- **Priority:** P0 · **Effort:** M
- Terms of sale, privacy policy, cookie policy, returns/withdrawal (14-day EU right), legal notice (Spain LSSI). Cookie banner with granular consent. Users can export and delete their data.
- [ ] Footer links to all legal pages (checkout checkbox links work)
- [ ] No analytics/marketing script loads before consent
- [ ] "Download my data" and "Delete my account" in the account area

### C. Customer experience (P1)

#### F08 — Customer account area
- **Priority:** P1 · **Effort:** M · **Depends on:** F02
- `/account`: profile, order history with status timeline and tracking link, saved addresses, change password, re-order button.
- [x] Order detail shows items, address, payment and shipping status
- [x] Guest orders can be claimed after registering with the same email
- [x] Header shows the logged-in user (the shared Header is currently unused)

#### F09 — Password reset and email verification
- **Priority:** P1 · **Effort:** S · **Depends on:** Prompt 1
- Replace the `mailto:` "forgot password" link with a real flow (Supabase Auth recovery, expiring tokens); verify email on signup.
- [ ] Reset link works once and expires
- [ ] Unverified users can browse but must verify before checkout (configurable)
- [ ] Generic responses (no user enumeration)

#### F10 — Persistent wishlist / favorites
- **Priority:** P1 · **Effort:** S · **Depends on:** F01
- The `amal_favorites` table already exists. Wire heart buttons to `PUT/DELETE /api/favorites/:id`, guest favorites in `localStorage` merged on login, and a `/favorites` page.
- [x] Favorites persist across devices for logged-in users
- [x] Header heart shows a count and links to the page
- [x] "Back in stock" email opt-in on a favorited sold-out item (stretch)

#### F11 — Server-side search, filters and pagination
- **Priority:** P1 · **Effort:** M · **Depends on:** F01
- Filters: category, price range, movement (automatic / hand-wound / quartz), case size, strap material, in-stock only; sort; URL query params; Postgres full-text search (`tsvector`) or `pg_trgm` for typo tolerance.
- [ ] Filter state lives in the URL (shareable, back-button safe)
- [ ] Search handles accents and small typos ("cronografo")
- [ ] Empty state suggests alternatives

#### F12 — Reviews and ratings (verified purchase)
- **Priority:** P2 · **Effort:** M · **Depends on:** F08
- Only customers who bought the watch can review; star rating + text + optional photo; admin moderation; aggregate rating in JSON-LD.
- [ ] One review per order item
- [ ] Moderation queue in admin
- [ ] Average rating shown on cards and detail page

### D. Operations & admin (P0–P1)

#### F13 — Admin: real dashboard + product management
- **Priority:** P0 · **Effort:** L · **Depends on:** F01, F02 · *Prompt 6*
- Real KPIs (revenue, orders, AOV, customers, low-stock, period-over-period), product CRUD with image upload to Supabase Storage, publish/unpublish, soft delete.
- [ ] Zero hardcoded numbers in the admin
- [ ] Image upload validates type and size on the server
- [ ] All changes recorded in an audit log

#### F14 — Admin: order management workflow
- **Priority:** P0 · **Effort:** M · **Depends on:** F02, F15
- Statuses: `pending → paid → preparing → shipped → delivered`, plus `cancelled` / `refunded`. Add carrier + tracking number, internal notes, partial/full refund via Stripe, printable packing slip and invoice PDF, real CSV export (with CSV-injection protection).
- [ ] Changing to "shipped" requires a tracking number and emails the customer
- [ ] Refund updates Stripe and stock (optional restock)
- [ ] Filter by status/date/country; paginated

#### F15 — Transactional email system
- **Priority:** P0 · **Effort:** M
- Provider: Resend / Postmark / SES. Templates (ES/EN/FR): order confirmation, payment failed, shipped + tracking, delivered, password reset, newsletter confirmation. Queue with retries.
- [ ] Emails sent from a verified domain (SPF/DKIM/DMARC)
- [ ] Failures retried and logged, never blocking the order
- [ ] Preview/test script for every template

#### F16 — Inventory management and low-stock alerts
- **Priority:** P1 · **Effort:** S–M · **Depends on:** F02
- Stock reservation during checkout (e.g. 15 min), "sold out" UI + back-in-stock waitlist, per-product low-stock threshold, admin alert (email/Slack) and stock-movement history.
- [ ] Abandoned checkout releases reserved stock automatically
- [ ] Sold-out items can't be added to the cart
- [ ] Stock history shows who/why for each change

### E. Growth & trust (P1–P2)

#### F17 — Real newsletter with double opt-in
- **Priority:** P1 · **Effort:** S
- Wire the "Suscribirme" button (today it only shows a toast) to `POST /api/newsletter`, add an email field, confirmation email, one-click unsubscribe, admin list + export, and consent text.
- [ ] Duplicate emails handled gracefully
- [ ] Confirmed vs. pending subscribers distinguished
- [ ] Unsubscribe link in every email

#### F18 — Discount codes and promotions
- **Priority:** P2 · **Effort:** M · **Depends on:** F03
- Percentage / fixed / free-shipping codes with expiry, usage limits, minimum cart value, and a first-order welcome code granted on newsletter confirmation.
- [ ] Code is validated server-side and applied to the Stripe session
- [ ] Admin can create, disable and view usage
- [ ] Code cannot be stacked unless explicitly allowed

#### F19 — Internationalisation (ES / EN / FR)
- **Priority:** P1 · **Effort:** M · *Prompt 8*
- `react-i18next`; translate UI, emails and product copy (translatable fields in DB); language switcher; localized URLs and `hreflang`.
- [ ] No mixed-language strings anywhere
- [ ] Language persisted and detected from the browser
- [ ] Product names/descriptions editable per language in admin

#### F20 — SEO, performance and analytics
- **Priority:** P1 · **Effort:** M · *Prompt 8*
- Per-page meta, sitemap, structured data (Product, Organization, Breadcrumb), self-hosted optimised images, code-splitting, privacy-friendly analytics (Plausible/Umami) with conversion funnel (view → cart → checkout → paid), error monitoring (Sentry).
- [ ] Lighthouse mobile ≥ 90, SEO ≥ 95
- [ ] Funnel dashboard shows drop-off per step
- [ ] Errors in web + API are reported with release tags

**Bonus ideas (after the 20):** 5-year warranty registration and claim form (the site already promises it), engraving/personalisation option, gift wrapping + message, "book a viewing / contact the atelier" appointment form, watch-care guide in the Journal, abandoned-cart recovery emails, wishlist price-drop alerts.

---

## 6. Suggested roadmap

| Phase | Goal | Contents | Rough time |
|---|---|---|---|
| **0 — Stop the bleeding** | Safe to deploy | Prompt 1 (auth/security), Prompt 7 steps 1–3 (cleanup + README), rotate any credential that ever used `admin1234` | 2–4 days |
| **1 — Real data** | Backend is real | Prompt 2, Prompt 3, F01, F02, F04 | 1.5–2 weeks |
| **2 — Sell** | First real order | Prompt 4, F05, F03, F15, F06, F07 | 2–3 weeks |
| **3 — Operate** | Run the shop | Prompt 6, F13, F14, F16, F08, F09 | 2 weeks |
| **4 — Polish & grow** | Convert and retain | Prompt 8, F10, F11, F17, F19, F20, then F12, F18 | 2–3 weeks |
| **Continuous** | Quality | Prompt 7 steps 4–7 (lint, tests, CI) starting in Phase 1 | ongoing |

**Definition of "ready to launch":** F01–F07, F13–F15 done; Prompt 1 fully applied; CI green; Stripe webhook tested end-to-end; legal pages live; backups enabled on the database.

---

*Generated from a static read of the repository. Where a finding says "never imported / never called", it was verified by searching the source tree.*
