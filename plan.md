# COD Flow: Project Execution & Architecture Plan

## 1. Project Overview & Objectives
**COD Flow** is a high-performance, multi-tenant operations platform architected specifically for Cash-on-Delivery (COD) e-commerce merchants. It provides unified order ingestion, lead intent verification via call-center queues and WhatsApp (WAHA companion engine), multi-carrier logistics tracking, and financial reconciliation of cash remittances.

---

## 2. Completed Milestones & Components

### Phase 1: Database Schema & Entity Design (Supabase / PostgreSQL / SQLite)
- [x] **Dual Database Engine**:
  - PostgreSQL / Supabase schema migrations DDL (`backend/src/database/ddl/supabase_schema.sql`) with foreign keys, composite indexes (`store_id, order_status`, `customer_phone`, `tracking_number`), and Row-Level Security readiness.
  - Zero-dependency automated fallback to SQLite (`codflow.sqlite` or in-memory) for instantaneous local developer setup and automated testing without external cloud/Docker dependencies.
- [x] **Entity Architecture (20+ Domain Entities)**:
  - **Users & Access**: `User`, `Role`, `UserStoreAssignment`
  - **Merchant Domain**: `Seller`, `Store`
  - **Commerce Domain**: `Customer`, `Lead`, `Product`, `Order`, `OrderItem`, `OrderStatusHistory`, `CancellationReason`
  - **Integration Domain**: `StoreIntegrationProvider`, `StoreIntegrationAccount`, `WebhookSubscription`, `IntegrationCredential`
  - **WhatsApp Domain**: `WhatsAppConnection`, `MessageBroadcast`, `MessageDeliveryLog`
  - **Courier & Logistics**: `CourierCompany`, `CourierAccount`, `Shipment`, `ShipmentTrackingSnapshot`, `DeliveryAttempt`, `ReturnRequest`
  - **Finance Domain**: `RemittanceFile`, `ReconciliationRecord`, `PayoutDiscrepancy`
  - **Audit & Call Center**: `CallLog`, `AuditLog`
- [x] **Data Seeder (`seed.ts`)**:
  - Automatically seeds default roles (`Admin`, `Moderator`, `Manager`, `Agent`, `Seller`).
  - Pre-configures integration providers (`Shopify`, `WooCommerce`, `YouCan`).
  - Pre-configures courier accounts (`J&T Express`, `DHL Express`, `Ninja Van`).
  - Creates demo accounts for Admin (`admin@codflow.io`), Seller (`seller@codflow.io`), and Agent (`agent@codflow.io`).
  - Populates realistic COD orders in each state of the operational lifecycle.

---

### Phase 2: Security & Hardware-Grade Cryptography
- [x] **Credential Encryption (`src/utils/crypto.ts`)**:
  - Implemented **AES-256-GCM** authenticated symmetric encryption for storing sensitive external API keys, shop tokens, courier credentials, and WAHA tokens.
- [x] **Multi-Tenant Store Isolation (`src/middlewares/storeScope.middleware.ts`)**:
  - Strict store verification: users can only view or mutate stores they are explicitly assigned to in `user_store_assignments` (or own directly as Seller). Admins have global operational access.
- [x] **Role-Based Access Control (`src/middlewares/rbac.middleware.ts`)**:
  - Hierarchical role guards: `SuperAdmin` (God-mode platform master), `Admin` (Platform management), `Moderator`, `Manager`, `Agent` (Call center verification), and `Seller` (Store merchant).
  - Staff creation hierarchy: SuperAdmin can create Admins, Managers, Moderators, and Agents; Admins can create Managers, Moderators, and Agents.
  - Transparent Store Access Model:
    - **Sellers**: `ownedStores` (`accessType: 'owner'`)
    - **Agents & Managers**: `assignedStores` (`accessType: 'assigned'`)
    - **Admins & SuperAdmins**: `managedStores` (`accessType: 'manage'`)
- [x] **Staff & User Administration Module (`/api/admin/users`)**:
  - SuperAdmin / Admin endpoints to register staff members with direct store assignment and active status toggling.
- [x] **Merchant Self-Registration (`/api/auth/register`)**:
  - Allows new merchants to self-register with automatic initial store provisioning.

---

### Phase 3: Backend REST Services & APIs
- [x] **Authentication Service (`/api/auth`)**:
  - Password hashing with bcrypt, JWT token issuance, session verification (`/api/auth/me`).
- [x] **Sellers & Stores Service (`/api/sellers`)**:
  - Merchant profile management, store creation, agent/user assignment to stores.
- [x] **Order Lifecycle & Ingestion Service (`/api/orders`, `/api/webhooks`)**:
  - State machine: `pending_verification` ➔ `confirmed` / `rescheduled` ➔ `fulfillment` ➔ `shipped` ➔ `delivered` / `returned` / `cancelled`.
  - Ingestion from **Shopify**, **WooCommerce**, and **YouCan** webhooks with automatic entity normalization.
  - Bulk CSV order intake parser.
- [x] **Call Center Operations (`/api/call-center`)**:
  - Priority queue of unverified orders sorted by fewest attempts.
  - Dial attempt recording with duration counter and outcome categorization (`confirmed`, `cancelled`, `no_answer`, `busy`, `unreachable`, `rescheduled`).
  - **Automated WhatsApp Follow-Up Trigger**: Immediately queues a WhatsApp message when a lead is marked unreachable.
- [x] **Logistics & Multi-Carrier Sync (`/api/couriers`)**:
  - Store-level carrier accounts (J&T, DHL, Ninja Van).
  - Tracking snapshot normalization engine (`created`, `in_transit`, `out_for_delivery`, `delivered`, `returned`).
  - Reverse logistics return requests.
- [x] **WAHA WhatsApp Companion Engine (`/api/whatsapp`)**:
  - REST client wrapper for [devlikeapro/waha](https://github.com/devlikeapro/waha).
  - Session pairing, live QR code display, and status checking.
  - Rate-limited broadcast sender with configurable throttle interval (1s – 8s) to prevent bans.
  - Inbound webhook processor for delivery receipts (`sent`, `delivered`, `read`).
  - Embedded mock engine for zero-dependency offline execution.
- [x] **Financial Cash Reconciliation (`/api/reconciliation`)**:
  - Remittance file upload and parsing.
  - Automated comparison between carrier collected cash and delivered order totals.
  - Discrepancy detection engine (`underpayment`, `overpayment`, `ghost_shipment`, `uncollected_returned`) with interactive resolution workflows.
- [x] **Structured Logging & Diagnostics**:
  - Winston structured JSON logger with request timing, client IP, and error stacks.

---

### Phase 4: Frontend Web Dashboard (Next.js App Router)
- [x] **Modern Visual System**:
  - High-contrast slate/emerald/amber palette with visible borders, glowing accents, and zero black-on-black blending.
  - Responsive App Router structure with store switcher and user badge.
- [x] **Trilingual Multi-Language System**:
  - English (`en`), French (`fr`), and Arabic (`ar`).
  - Native **RTL (Right-to-Left)** support with Arabic Cairo typography when Arabic is selected.
  - 1-click language switcher in top navigation bar with persistent selection.
- [x] **Core Pages**:
  - `/` Executive Dashboard: Topline KPIs, delivery success %, return rate %, lifecycle progress bar, recent orders feed.
  - `/orders` Orders Center: Status pipeline tabs, search filter, order details drawer, manual creation modal, CSV batch ingestion modal.
  - `/call-center` Agent Workspace: Live queue, phone dial simulator with live timer, outcome buttons, and 1-click WhatsApp messaging.
  - `/couriers` Logistics Hub: Configured carrier accounts, dispatched waybills table, tracking timeline milestones.
  - `/whatsapp` WAHA Hub: Session controller, QR pairing status, throttled broadcast campaign launcher, delivery logs table.
  - `/finance` Financial Reconciliation Portal: Remittance upload dropzone, matched cash counters, discrepancy resolution table.
  - `/integrations` Storefront Connectors: Shopify, WooCommerce, YouCan webhook URLs with copy button and encryption documentation.
  - `/admin` Platform Oversight: System stats, agent productivity leaderboard, and immutable audit logs.
  - `/login` Authentication Screen: 1-click quick login buttons for Seller, Agent, and Admin roles.

---

### Phase 5: Automated Testing & Verification
- [x] **Jest & Supertest Suite**:
  - 19 comprehensive backend tests across all modules (including multi-session WhatsApp & agent commissions) passing with 100% success rate.
- [x] **Frontend Production Build**:
  - Next.js 14 App Router builds and prerenders all routes cleanly.
- [x] **Playwright E2E Test Suite**:
  - Configured in `frontend/e2e/codflow.spec.ts` covering login, order drawer, dial simulator, and remittance uploads.
- [x] **Docker Compose Orchestration**:
  - `docker-compose.yml` defining PostgreSQL, WAHA container (pinned to port `3008:3000`), Backend API (port `4000`), and Frontend web server (port `3000`).

---

### Phase 6: Multi-Session WhatsApp Architecture (WAHA Integration)
- [x] **Multi-Line Phone Sessions per Store**:
  - Sellers can connect and manage multiple WhatsApp phone numbers/lines per store (e.g. Primary Support, Confirmation Agent 01, Sales Line 2).
  - Sessions can be managed and used by Sellers (store owners), Call Center Agents, Managers, Admins, and SuperAdmins.
  - Endpoints added:
    - `GET /api/whatsapp/health`: Probes WAHA Docker container at port 3008.
    - `GET /api/whatsapp/sessions/:storeId`: Lists all phone lines and sessions for a store.
    - `POST /api/whatsapp/sessions/:storeId`: Creates/registers a new phone session with custom line label, phone number, and engine (NOWEB / WebJS).
    - `POST /api/whatsapp/sessions/:storeId/:sessionId/connect`: Pairs and syncs a specific session with WAHA and retrieves QR code.
    - `POST /api/whatsapp/sessions/:storeId/:sessionId/default`: Sets primary default line for dispatch.
    - `DELETE /api/whatsapp/sessions/:storeId/:sessionId`: Safely disconnects and deletes a session.
    - `POST /api/whatsapp/send/:storeId`: Dispatches direct 1-to-1 client WhatsApp messages through any chosen session line.
- [x] **WAHA Docker Port Separation**:
  - Docker Compose configured with `3008:3000` mapping so WAHA never collides with Next.js port 3000.
  - Backend configured with `WAHA_API_URL=http://localhost:3008`.

---

### Phase 7: Agent Commission & Payout System
- [x] **Automated Lifecycle Commission Accrual**:
  - When a call center agent verifies an order (`status ➔ confirmed`), the agent is recorded (`assignedAgentId`) and credited with the store's confirmed commission rate (`agentCommissionPerConfirmedOrder`, default 5 MAD/USD).
  - When that order is delivered (`status ➔ delivered`), the assigned agent is credited with the store's delivered commission rate (`agentCommissionPerDeliveredOrder`, default 15 MAD/USD).
  - Real-time audit history and order ledger tracking (`agentCommissionAmount`).
- [x] **Store Commission Rate Configuration & Reporting**:
  - Admins, SuperAdmins, and Sellers can configure commission rates via `PUT /api/sellers/stores/:storeId/commissions`.
  - Full agent performance and accrued payout ledger accessible via `GET /api/sellers/stores/:storeId/agent-commissions`.
  - Frontend interactive commission editor and payout breakdown ledger on `/finance`.

---

### Phase 8: Root Operations Funnel Page (`/`)
- [x] **COD Operations & Conversion Funnel Dashboard**:
  - Built a bulletproof, visual funnel interface on `http://localhost:3000/`.
  - Displays 5 live funnel stages:
    1. **Stage 1: Lead Intake** (Shopify, YouCan webhooks, manual intake)
    2. **Stage 2: Phone Confirmation** (Call center queue, confirmation rate %, eliminates fake orders)
    3. **Stage 3: Multi-Session WhatsApp** (Customer follow-up, WAHA companion engine on port 3008)
    4. **Stage 4: Logistics & Dispatch** (J&T Express, DHL waybill tracking)
    5. **Stage 5: Cash Delivery & Agent Commission** (COD cash collected & agent earnings awarded)
  - Interactive "Simulate Inbound Lead" button to instantly test lead ingestion and queueing.
  - Instant role credentials card for SuperAdmin, Admin, Seller, and Agent.

---

### Phase 9: Order Center Submenu & Status Counts
- [x] **Expandable Sidebar Orders Submenu**:
  - Implemented expandable status navigation under "Orders" in the sidebar with live counts and color-coded status badges:
    - `All Orders` (total store orders)
    - `Pending Verification` (`pending_verification`)
    - `Confirmed` (`confirmed`)
    - `Fulfillment` (`fulfillment`)
    - `Shipped` (`shipped`)
    - `Delivered` (`delivered`)
    - `Returned` (`returned`)
    - `Cancelled` (`cancelled`)
  - Integrated `useSearchParams` in `frontend/src/app/orders/page.tsx` to automatically read `?status=` and filter the table accordingly.

---

### Phase 10: 10 Store Integrations & Gemini AI Column Matcher
- [x] **Universal E-commerce Vocabulary Adapter (`ecommerce.adapters.ts`)**:
  - Built normalization adapters for all 10 e-commerce storefronts and funnel builders:
    1. **Google Sheets**
    2. **Shopify**
    3. **YouCan**
    4. **Storeep**
    5. **WooCommerce**
    6. **Lightfunnels**
    7. **Storeino**
    8. **EasyOrders**
    9. **Magento**
    10. **Simple / Custom API**
- [x] **Gemini AI Smart Column Matcher (`gemini.service.ts`)**:
  - Automatically matches custom sheet column names across French, Arabic, Darija, and English.
  - **Strict Cost Optimization**: Analyzes at most **10 sample rows** to keep LLM token costs minimal.
  - High-fidelity multilingual dictionary fallback ensuring 100% uptime even when API keys are unconfigured.
- [x] **Frontend Stores Integration Hub (`/integrations/stores`)**:
  - 10 interactive tabs with dedicated webhook URLs, documentation, and live Google Sheets AI Column Matcher & Row Sync tool.

---

### Phase 11: 10 Shipping Companies & Logistics Normalizer
- [x] **10 Courier Providers Supported**:
  - `IRSALIYAT`, `ONESSTA`, `FORCELOG`, `AMEEX`, `CATHEDIS`, `CHRONO DIALI`, `SENDIT`, `OZON EXPRESS`, `DIGYLOG`, `KARGO EXPRESS`.
- [x] **Unified Status Normalizer (`shipping.adapters.ts`)**:
  - Translates carrier-specific terminology (`CMD_CREEE`, `DISTRIBUTION`, `LIVRÉ`, `RETOUR`, `Echec`, `Non abouti`) into canonical lifecycle states (`created`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `failed_attempt`, `returned`, `cancelled`).
- [x] **Inbound Courier Webhooks (`/api/couriers/webhook/:courierCode`)**:
  - Enables couriers to push live tracking events and automated COD remittance reconciliation.
- [x] **Frontend Shipping Companies Hub (`/integrations/shipping`)**:
  - Dedicated cards for all 10 couriers with AES-256 encrypted credential connection modals.

---

### Phase 13: Pristine Account Zero-Data Guarantee, Store APIs & Google Sheets AI Redesign
- [x] **Zero Dummy Data Guarantee for Clean Accounts**:
  - Identified and eliminated hardcoded store fallback (`apex-casablanca`) across frontend pages (`frontend/src/app/orders/page.tsx`, `frontend/src/app/page.tsx`, `Sidebar.tsx`).
  - Fixed falsy fallback bug where `0 || 38` evaluated to dummy numbers; migrated all metrics to nullish coalescing (`?? 0`).
  - Purged any historical test orders from the database for `atlas-live`, ensuring `seller.live@codflow.io` displays pristine 0 orders, 0 revenue, and an intuitive empty state with setup actions.
- [x] **Store Integrations Workflow Correction (`/integrations/stores`)**:
  - Replaced static webhook URLs with a true store credential submission form.
  - For 9 e-commerce platforms (**Shopify, YouCan, Storeep, WooCommerce, Lightfunnels, Storeino, EasyOrders, Magento, Custom API**):
    - Seller submits **Store Name**, **Store URL / Domain**, and **API Credentials / Access Tokens**.
    - Backend endpoints (`GET /api/sellers/stores/:storeId/integrations`, `POST /api/sellers/stores/:storeId/integrations`, `DELETE /api/sellers/stores/:storeId/integrations/:id`) securely store and encrypt all credentials via **AES-256-GCM**.
    - Real-time connected stores management table with platform badges, domain links, and 1-click disconnect actions.
- [x] **Google Sheets Integration Redesign (No Webhook URL)**:
  - Completely removed webhook URLs from the Google Sheets tab.
  - Features dedicated inputs for **Sheet Name**, **Google Sheet Share URL**, and **Worksheet / Tab Name**.
  - Integrated **Gemini 1.5 Flash AI Smart Column Matcher** (strictly capped at max 10 sample rows to minimize LLM token cost) with instant mapping to COD Flow order attributes across French, Arabic, and English.
  - Direct "Sync Orders to Order Center" action button.
- [x] **Gemini Sheets AI Environment Toggle**:
  - Added `ENABLE_GEMINI_SHEETS_AI=true` / `false` toggle in `backend/.env` and `backend/.env.example`.
  - When set to `false`, the backend cleanly bypasses external Gemini API calls and uses the high-precision multilingual heuristic column matcher during local testing.

---

### Phase 14: Network Port Allocations (Frontend Port 3008 & WAHA Port 3000)
- [x] **Frontend Web App**:
  - Updated `frontend/package.json` scripts (`"dev": "next dev -p 3008"`, `"start": "next start -p 3008"`).
  - Web application is live and accessible at **`http://localhost:3008`**.
- [x] **WAHA WhatsApp Companion Engine**:
  - Updated `backend/.env`, `backend/.env.example`, and `backend/src/config/index.ts` to point to **`http://localhost:3000`** (`WAHA_API_URL=http://localhost:3000`), matching WAHA's standard Docker port.

---

### Phase 15: WhatsApp WAHA Integration (QR Code, Chats, Contacts) & Clean Account Purge
- [x] **Store Scoping Authorization Fix**:
  - Resolved `Error creating WhatsApp session: You are not authorized to view or manage this store`.
  - In `backend/src/middlewares/storeScope.middleware.ts`, fixed user store assignment lookup to query `store.id` (UUID) instead of the raw `storeId` param (which can be a slug string like `atlas-live`).
- [x] **WAHA Engine Client Full Upgrade (`backend/src/modules/whatsapp/waha.client.ts`)**:
  - Implemented full WAHA REST API specification (`https://waha.devlike.pro/docs/`):
    - `startSession(name)`: POST to `/api/sessions/` / `/api/sessions/start`.
    - `getQRCode(session)`: Queries `/api/{session}/auth/qr?format=image` and converts binary arrayBuffer to base64 Data URL (`data:image/png;base64,...`), with fallback to raw QR string or mock SVG.
    - `getChats(session)`: Queries `/api/{session}/chats` for all active conversations with unread badges and timestamps.
    - `getContacts(session)`: Queries `/api/{session}/contacts` for directory listings with phone numbers.
    - `getMessages(session, chatId, limit)`: Queries `/api/{session}/chats/{chatId}/messages` for full chat message bubbles and timestamps.
    - `sendText(session, chatId, text)`: Sends instant customer WhatsApp messages via `/api/sendText`.
- [x] **Frontend WhatsApp Operations Center Overhaul (`frontend/src/app/whatsapp/page.tsx`)**:
  - Removed hardcoded store fallback (`apex-casablanca`); initialized dynamically via `api.getCurrentStore()`.
  - Added interactive **Scan WhatsApp QR Code Modal** with live polling (every 2.5s) until status becomes `WORKING`.
  - Added **Live Chats & Inbox** tab: split view with active conversations, unread counters, and message bubble thread with real-time text sender.
  - Added **Contacts Directory** tab: searchable contact cards with phone numbers and 1-click "Chat" launcher.
  - Retained **Broadcast Campaigns** and **Delivery Logs** audit table.
- [x] **Zero Dummy Data Elimination Across All Modules**:
  - **Call Center (`/call-center`)**: Removed hardcoded sample queues; displays clean empty state ("Queue is Clear") for clean merchants.
  - **Couriers (`/couriers`)**: Initialized state to empty arrays; displays clean empty state ("No Courier Accounts Connected") with a direct link to `/integrations/shipping`.
  - **Finance (`/finance`)**: Cleaned initial state for remittance files, discrepancies, and agent commissions; displays empty table rows with intuitive setup prompts.
  - **Integrations / Stores (`/integrations/stores`)**: Removed all pre-populated sample store names and tokens.

---

### Phase 16: Live WAHA Docker Container Synchronization & 1-Click Instant QR Pairing
- [x] **Live Container Detection & Authentication**:
  - Connected to active WAHA Docker container on port `3000` (`version: 2026.8.2`, `engine: WEBJS`, `tier: CORE`).
  - Configured `WAHA_API_KEY=26142715261640b99b7b2204ba8efb8a` and `WAHA_MOCK_MODE=false` in `backend/.env`.
- [x] **Elimination of Intermediate "Type Infos" Form**:
  - Replaced the input form modal with a direct **1-Click QR Code Scanner**.
  - Clicking **"Add WhatsApp Line"** or **"Connect First WhatsApp Line (QR Code)"** instantly pops up the QR code modal without asking the user to type any information.
- [x] **Automated Session Provisioning & Live QR Streaming**:
  - Automatically provisions the session on the backend with clean identifiers (`store_${slug}_line_${rand}`).
  - Directly requests WAHA to start Chromium in `WEBJS`.
  - Backend `getQRCode` auto-restarts stopped sessions and pipes the binary PNG buffer directly as `data:image/png;base64,...`.
  - Frontend auto-polls every 1.8s until status switches to `WORKING`, automatically confirming pairing and refreshing the session list.






