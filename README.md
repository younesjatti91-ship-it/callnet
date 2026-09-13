# COD Flow: Multi-Tenant Cash-on-Delivery Operations Platform

**COD Flow** is an enterprise-grade, secure, multi-tenant operations platform architected specifically for Cash-on-Delivery (COD) e-commerce sellers. It unifies order intake across storefronts, automates lead verification via call-center queues and WhatsApp (WAHA companion engine), provides multi-carrier tracking normalization, and reconciles courier cash remittances.

---

## Key Architecture & Features

### 1. Multi-Tenant RBAC & Security Layer
- **Roles Hierarchy**: `Admin`, `Moderator`, `Manager`, `Agent`, `Seller`.
- **Store-Level Authorization**: Direct store scoping enforcement via `user_store_assignments` table and `requireStoreAccess` middleware.
- **Hardware-Grade Cryptography**: All integration credentials (Shopify tokens, WooCommerce keys, WAHA auth, Carrier API keys) are encrypted at rest using **AES-256-GCM** with authenticated checksum tags.
- **Security Middlewares**: Helmet HTTP security headers, configurable CORS, express rate limiting, and strict input validation via **Zod** schemas.

### 2. Order Lifecycle & Call Center Operations
- **Intake Sources**: Native Webhook ingestors for **Shopify**, **WooCommerce**, and **YouCan**, CSV batch imports, and manual order creation.
- **Deterministic State Engine**: `pending_verification` ➔ `confirmed` / `rescheduled` ➔ `fulfillment` ➔ `shipped` ➔ `delivered` / `returned` / `cancelled` with full audit history.
- **Agent Queue**: Live queue sorting by least attempts and intake age. One-click dial recording with simulated duration timers, outcome tagging, and automated WhatsApp follow-ups triggered when a lead is unreachable.

### 3. Courier & Multi-Carrier Logistics
- **Multi-Carrier Accounts**: Store-level accounts for J&T Express, DHL Express, Ninja Van, and others.
- **Normalized Tracking Model**: Normalizes carrier status payloads into standard timeline milestones (`created`, `in_transit`, `out_for_delivery`, `delivered`, `returned`).
- **Exception & Reverse Logistics**: Return request handling and inventory restock tracking.

### 4. WAHA WhatsApp Companion Engine
- Integrated directly with [devlikeapro/waha](https://github.com/devlikeapro/waha) REST API.
- Session control (`NOWEB` / `WebJS`), QR code pairing, and live device status.
- Anti-ban broadcast launcher with configurable throttling delay (1000ms – 8000ms).
- Inbound webhook processing with ACK delivery logs (`sent`, `delivered`, `read`).
- Zero-dependency built-in mock mode for instant local testing.

### 5. Financial Reconciliation Engine
- Remittance file upload (CSV / Excel format) parsing.
- Automated cash matching comparing carrier collected COD amount against actual delivered orders.
- Discrepancy detection engine flagging underpayments, overpayments, ghost waybills, and uncollected returned parcels with resolution audit trails.

---

## Project Structure

```
callnet/
├── backend/
│   ├── src/
│   │   ├── config/              # Centralized environment configuration
│   │   ├── database/            # TypeORM DataSource, SQLite/Postgres configs
│   │   │   ├── entities/        # 20+ TypeORM domain entities
│   │   │   ├── ddl/             # Supabase PostgreSQL DDL migration script
│   │   │   └── seed.ts          # Default roles, demo tenants, and sample orders
│   │   ├── middlewares/         # Auth, RBAC, Store-Scope, RateLimit, Zod, ErrorHandler
│   │   ├── modules/
│   │   │   ├── auth/            # JWT authentication & registration
│   │   │   ├── sellers/         # Seller & Store management, user assignments
│   │   │   ├── orders/          # Orders lifecycle, webhooks (Shopify/Woo/YouCan), CSV
│   │   │   ├── callcenter/      # Agent queue, dial logging, auto WhatsApp trigger
│   │   │   ├── couriers/        # Multi-carrier accounts & tracking snapshots
│   │   │   ├── whatsapp/        # WAHA API client, broadcast engine & webhooks
│   │   │   ├── reconciliation/  # Cash remittance matching & dispute resolution
│   │   │   └── analytics/       # Store COD KPIs & agent leaderboard
│   │   ├── utils/               # AES-256 crypto, Winston logger
│   │   ├── app.ts               # Express app factory
│   │   └── server.ts            # Server entry point
│   ├── tests/                   # Jest + Supertest integration tests (17 passed)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router (Dashboard, Orders, Call Center, Couriers, WAHA, Finance, Integrations, Admin, Login)
│   │   ├── components/          # Sidebar, Header, StatusBadge, Glassmorphism components
│   │   └── lib/                 # Typed API client, utility functions
│   ├── e2e/                     # Playwright E2E test specs
│   └── package.json
├── docker-compose.yml           # Turnkey PostgreSQL + WAHA + Backend + Frontend stack
└── README.md
```

---

## Quickstart Guide

### Option 1: Local Development (Instant SQLite Dev Mode)

No external database or Docker required:

```bash
# 1. Start Backend API
cd backend
npm install
npm run dev
# Backend boots on http://localhost:4000 with auto-seeded demo data

# 2. Start Frontend Next.js Web App (in a separate terminal)
cd ../frontend
npm install
npm run dev
# Frontend boots on http://localhost:3000
```

### Option 2: Full Docker Stack (PostgreSQL + WAHA + Backend + Frontend)

```bash
docker-compose up -d --build
```

---

## Demo Test Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Merchant Seller** | `seller@codflow.io` | `SellerPass123!` | Manages Apex Casablanca Store & integrations |
| **Super Admin** | `admin@codflow.io` | `AdminPass123!` | Universal platform & tenant administration |
| **Call Center Agent** | `agent@codflow.io` | `AgentPass123!` | Verification queues & dial logging |

---

## Automated QA & Test Suites

### Backend Unit & Integration Tests (Jest & Supertest)
```bash
cd backend
npm test
```
All **17 comprehensive tests** pass:
- Health check
- Auth & RBAC access control
- Orders lifecycle state machine & transitions
- Shopify webhook intake
- Call center queue assignment & dial attempt logging
- Automated WhatsApp follow-up triggers on `no_answer`
- Multi-carrier account creation & tracking snapshot normalization
- WAHA session query & template message dispatch
- Financial remittance parsing, exact cash matching & discrepancy resolution
- Store KPI aggregation

### Frontend Production Build
```bash
cd frontend
npm run build
```
All 9 App Router routes compile and statically prerender cleanly.
