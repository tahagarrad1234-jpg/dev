# AMAL Watches — Monorepo

> **AMAL** is an atelier-grade luxury horology storefront, customer portal, and administrative command center built for high precision and performance.

---

## Architecture Overview

```
                                      ┌────────────────────────┐
                                      │   Client Browser / PWA │
                                      │   React 19 + Tailwind4 │
                                      └───────────┬────────────┘
                                                  │
                                       HTTPS / Vite Proxy
                                                  ▼
                                      ┌────────────────────────┐
                                      │   Express 5 API Service│
                                      │   (TypeScript + Zod)   │
                                      └───────┬────────┬───────┘
                                              │        │
                         Drizzle ORM (Pooler) │        │ Supabase Auth & Storage
                                              ▼        ▼
                      ┌─────────────────────────┐   ┌───────────────────────────┐
                      │ PostgreSQL (Supabase /  │   │ Supabase Auth (Argon2id)  │
                      │ AWS eu-west-2 / Local)  │   │ Object Storage (Pieces)   │
                      └─────────────────────────┘   └───────────────────────────┘
```

### Workspace Structure

| Package | Path | Purpose | Technologies |
|---|---|---|---|
| `@workspace/shared` | `packages/shared` | Single source of truth for contracts, Zod schemas, types, and seed catalogs | TypeScript 5.9, Zod |
| `@workspace/api` | `apps/api` | REST API service, auth sessions, orders engine with row locking, Stripe integration, and admin portal | Express 5, Drizzle ORM, node-postgres, Supabase, Pino |
| `@workspace/web` | `apps/web` | High-aesthetic luxury watch storefront, customer account, cart drawer, and admin dashboard | React 19, Vite 7, Tailwind CSS 4, wouter, TanStack Query |

---

## Prerequisites

- **Node.js**: `v20.x` or `v24.x` (recommended: Node 24)
- **Package Manager**: `pnpm` (v9.15.9+)
- **Database**: PostgreSQL (Supabase or local via Docker)

---

## Environment Variables

Copy the template from `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Port for the backend API | `4000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `WEB_ORIGIN` | Allowed client origin for CORS & auth cookies | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string (use IPv4 pooler on port 6543 for Supabase) | `postgresql://...` |
| `DATABASE_SSL` | SSL mode (`require`, `disable`, `prefer`) | `require` |
| `SUPABASE_URL` | Supabase project URL | `https://your-ref.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase service role key (bypasses RLS for API session storage) | `sb_secret_...` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `sb_publishable_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key for backend checkout sessions | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for client-side forms | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Database Migration & Seed
Run migrations and populate the initial catalog of 6 luxury watches:

```bash
pnpm --filter @workspace/api db:migrate
pnpm --filter @workspace/api seed
```

### 3. Create Admin User
To promote a registered customer to administrator:
```bash
pnpm --filter @workspace/api run create-admin -- admin@amalwatches.com
```

### 4. Start Development Servers
Run both API (`http://localhost:4000`) and Storefront (`http://localhost:5173`) concurrently:
```bash
pnpm dev
```

Or run them individually:
```bash
pnpm dev:api   # API only
pnpm dev:web   # Storefront only
```

---

## Scripts & Commands

| Command | Description |
|---|---|
| `pnpm run build` | Compiles API with esbuild and builds production frontend bundle |
| `pnpm run typecheck` | Strict TypeScript check across all packages (`shared`, `api`, `web`) |
| `pnpm test` | Runs Vitest automated test suites (pricing, token hashing, health, schemas) |
| `pnpm --filter @workspace/api db:generate` | Generates Drizzle SQL migrations from schema |
| `pnpm --filter @workspace/api db:migrate` | Applies pending migrations to PostgreSQL |
| `pnpm --filter @workspace/api seed` | Seeds catalog data safely (idempotent upsert by slug) |

---

## Docker & Containerization

A self-contained Docker environment is provided for local Postgres and API:

```bash
# Start local PostgreSQL and API
docker compose up -d

# Check health
curl http://localhost:4000/api/healthz
curl http://localhost:4000/api/readyz
```

---

## Testing & Quality Assurance

Automated tests are powered by **Vitest** and **Supertest**:

```bash
pnpm test
```

Test coverage includes:
- **Order Pricing & IVA**: Automatic 21% IVA calculation for Spain, zero-tax for international exports, and free-shipping threshold verification (>= 1,000 EUR).
- **Concurrency & Stock Safety**: Pessimistic row locking (`SELECT ... FOR UPDATE`) prevents overselling pieces.
- **Security & Tokens**: SHA-256 session token hashing, brute-force rate-limiting, and generic auth failure messages.
- **Health Probes**: Liveness `/api/healthz` and readiness `/api/readyz` with live database ping.

---

## Documentation

- [REST API Reference & Endpoints](docs/API.md)
- [Cleanup and Architecture Report](docs/CLEANUP_REPORT.md)
- [Comprehensive Audit & Features Roadmap](AMAL_PROJECT_AUDIT_PROMPTS_AND_FEATURES.md)
