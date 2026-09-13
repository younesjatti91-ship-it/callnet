# COD Flow API Endpoints Specification & Automated Postman Guide

**Base URL**: `http://localhost:4000/api`  
**Authentication Header**: `Authorization: Bearer <TOKEN>`  
**Content-Type**: `application/json`

---

## ⚡ Quick 1-Click Postman Import

You do **NOT** need to manually configure requests one-by-one. A complete, pre-configured Postman Collection is provided in the repository root:

📁 **File**: [`postman_collection.json`](file:///c:/Users/a/Documents/calnetsaas/callnet/postman_collection.json)

### How to Import:
1. Open **Postman**.
2. Click the **Import** button in the top-left corner.
3. Select or drag-and-drop the file [`postman_collection.json`](file:///c:/Users/a/Documents/calnetsaas/callnet/postman_collection.json).
4. Run the **`02. Authentication & Profile -> Login - Seller`** request.
5. **Done!** The collection automatically saves the returned JWT token to `{{token}}` and the active store ID to `{{storeId}}`. All subsequent requests in the collection are instantly authenticated and ready to execute!

---

## 🔌 System Ports Architecture

| Service | Host Port | Internal Container Port | Description |
| :--- | :--- | :--- | :--- |
| **COD Flow Backend API** | `4000` | `4000` | Express REST API (`/api/*`) & Developer Status (`/`) |
| **COD Flow Frontend** | `3008` | `3000` | Next.js App Router Web Platform (`http://localhost:3008`) |
| **WAHA WhatsApp API** | `3000` | `3000` | WAHA HTTP WhatsApp Engine (`WAHA_API_URL=http://localhost:3000`) |
| **PostgreSQL / Supabase** | `5432` | `5432` | Database container (when using `DB_TYPE=postgres`) |

---

## 1. Quick Auth Credentials & Tokens

You can obtain a JWT token immediately using the **Login Endpoint** or use these pre-seeded demo accounts:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Seller (Merchant)** | `seller@codflow.io` | `SellerPass123!` | Store owner, products, orders, campaigns, reconciliation |
| **Super Admin** | `admin@codflow.io` | `AdminPass123!` | Full platform administration, all stores and tenants |
| **Call Center Agent** | `agent@codflow.io` | `AgentPass123!` | Verification queues, dial attempts, customer notes |

---

## 2. Health & System Check

### `GET /health`
Verify server and database status.
- **Headers**: None
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/health"
```
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "COD Flow Operations Platform",
  "version": "1.0.0",
  "timestamp": "2026-09-12T22:15:00.000Z",
  "databaseType": "sqlite",
  "wahaMockMode": true
}
```

---

## 3. Authentication Module (`/api/auth`)

### `POST /auth/login`
Authenticate user with email and password, returning JWT token and accessible stores.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@codflow.io",
    "password": "SellerPass123!"
  }'
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u-seller-01",
      "email": "seller@codflow.io",
      "name": "Tariq Benali",
      "role": "Seller"
    },
    "stores": [
      {
        "id": "d00ebff9-3960-4aaf-a324-d9d08aa924fe",
        "name": "Apex Casablanca Store",
        "slug": "apex-casablanca",
        "currency": "MAD"
      }
    ]
  }
}
```

---

### `POST /auth/register`
Register a new seller account with an automatically provisioned default store.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newmerchant@codflow.io",
    "password": "MerchantPassword123!",
    "name": "Yassine Mansour",
    "companyName": "Mansour Direct Trading",
    "phone": "+212661998877"
  }'
```

---

### `GET /auth/me`
Retrieve active user session profile and assigned stores.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/auth/me" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 4. Sellers & Stores Module (`/api/sellers`)

### `GET /sellers` *(Admin / Moderator only)*
List all platform sellers and their stores.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/sellers" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### `POST /sellers/:sellerId/stores`
Create a new store tenant under a seller.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/sellers/<SELLER_ID>/stores" \
  -H "Authorization: Bearer <SELLER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Apex Rabat Store",
    "slug": "apex-rabat",
    "currency": "MAD",
    "locale": "fr"
  }'
```

---

### `GET /sellers/stores/:storeId`
Fetch store details, settings, and team assignments.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/sellers/stores/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `POST /sellers/stores/:storeId/assign`
Assign an agent, manager, or moderator to a store queue.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/sellers/stores/<STORE_ID>/assign" \
  -H "Authorization: Bearer <SELLER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>",
    "role": "Agent"
  }'
```

---

## 5. Orders Lifecycle & Ingestion Module (`/api/orders`)

### `GET /orders/:storeId`
List store orders with optional filters: `status`, `search`, `page`, `limit`.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/orders/<STORE_ID>?status=pending_verification&limit=20" \
  -H "Authorization: Bearer <TOKEN>"
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "1a8fd85d-1195-4570-90f3-19cc34e659b5",
        "orderNumber": "ORD-1001",
        "status": "pending_verification",
        "customerName": "Youssef El Amrani",
        "customerPhone": "+212612345678",
        "city": "Casablanca",
        "subtotal": 390.0,
        "shippingFee": 35.0,
        "codAmount": 425.0,
        "currency": "MAD"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### `POST /orders/:storeId`
Create a manual COD order.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/orders/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Rachid Benjelloun",
    "customerPhone": "+212611223344",
    "city": "Marrakech",
    "shippingAddress": "Avenue Guéliz, Résidence Al Manar Appt 4",
    "subtotal": 450.0,
    "shippingFee": 30.0,
    "codAmount": 480.0,
    "currency": "MAD",
    "source": "manual",
    "notes": "Customer requested delivery after 4pm",
    "items": [
      {
        "productName": "Cordless Handheld Vacuum Pro",
        "sku": "VAC-PRO-01",
        "quantity": 1,
        "unitPrice": 450.0,
        "totalPrice": 450.0
      }
    ]
  }'
```

---

### `PATCH /orders/:storeId/:orderId/status`
Transition order state with audit trail.
- **Allowed Statuses**: `pending_verification`, `confirmed`, `rescheduled`, `fulfillment`, `shipped`, `delivered`, `returned`, `cancelled`.
- **cURL Command**:
```bash
curl -X PATCH "http://localhost:4000/api/orders/<STORE_ID>/<ORDER_ID>/status" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "notes": "Customer confirmed order via phone call"
  }'
```

---

### `POST /orders/:storeId/import-csv`
Bulk ingest orders from CSV or JSON row array.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/orders/<STORE_ID>/import-csv" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [
      {
        "customerName": "Siham Berrada",
        "customerPhone": "+212655667788",
        "city": "Fes",
        "shippingAddress": "Quartier Atlas",
        "subtotal": "320",
        "shippingFee": "30",
        "codAmount": "350",
        "productName": "Electric Facial Cleanser"
      }
    ]
  }'
```

---

## 6. Storefront Webhook Endpoints (`/api/webhooks`)

*Note: These endpoints are public for webhook receiver services and protected by rate limiting.*

### `POST /webhooks/shopify/:storeId`
Receive incoming Shopify order creation webhooks and normalize into COD Flow.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/shopify/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 99281726,
    "email": "customer@gmail.com",
    "total_price": "550.00",
    "subtotal_price": "500.00",
    "currency": "MAD",
    "shipping_address": {
      "first_name": "Hamza",
      "last_name": "Idrissi",
      "phone": "+212677889900",
      "city": "Casablanca",
      "address1": "22 Rue Racine",
      "province": "Grand Casablanca"
    },
    "line_items": [
      { "title": "Smart Touch Air Fryer", "quantity": 1, "price": "500.00" }
    ]
  }'
```

---

### `POST /webhooks/woocommerce/:storeId`
Receive WooCommerce order creation webhooks.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/woocommerce/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 10294,
    "total": "420.00",
    "billing": {
      "first_name": "Fatima",
      "last_name": "Zahra",
      "phone": "+212644332211",
      "city": "Rabat",
      "address_1": "Avenue Allal Ben Abdellah"
    },
    "line_items": [
      { "name": "Wireless Neck Massager", "quantity": 1, "price": "420.00", "total": "420.00" }
    ]
  }'
```

---

### `POST /webhooks/youcan/:storeId`
Receive YouCan Shop order webhooks.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/youcan/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "yc-order-4820",
    "total": 290.0,
    "customer": {
      "first_name": "Omar",
      "last_name": "Chraibi",
      "phone": "+212633221100",
      "city": "Agadir",
      "address": "Hay Dakhla Rue 14"
    },
    "order_variants": [
      { "name": "Vintage Leather Watch", "price": 290.0, "quantity": 1 }
    ]
  }'
```

---

## 7. Call Center Agent Operations (`/api/call-center`)

### `GET /call-center/queue/:storeId`
Fetch unverified orders assigned to or accessible by the agent.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/call-center/queue/<STORE_ID>" \
  -H "Authorization: Bearer <AGENT_TOKEN>"
```

---

### `POST /call-center/calls/:storeId`
Record a call attempt with live outcome. If outcome is `no_answer`, `busy`, or `unreachable`, an automated WhatsApp message is automatically queued via WAHA.
- **Allowed Outcomes**: `confirmed`, `cancelled`, `no_answer`, `busy`, `unreachable`, `rescheduled`.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/call-center/calls/<STORE_ID>" \
  -H "Authorization: Bearer <AGENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<ORDER_ID>",
    "outcome": "no_answer",
    "durationSeconds": 32,
    "notes": "Customer phone rang with no answer; WhatsApp follow-up dispatched"
  }'
```

---

### `POST /call-center/assign/:storeId`
Manager/Admin bulk assigns orders to an agent.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/call-center/assign/<STORE_ID>" \
  -H "Authorization: Bearer <SELLER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderIds": ["<ORDER_ID_1>", "<ORDER_ID_2>"],
    "agentUserId": "<AGENT_USER_ID>"
  }'
```

---

### `GET /call-center/logs/:storeId/:orderId`
Get call attempt history for a specific order.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/call-center/logs/<STORE_ID>/<ORDER_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 8. Couriers & Multi-Carrier Logistics (`/api/couriers`)

### `GET /couriers/companies`
Get catalog of supported couriers (J&T Express, DHL, Ninja Van).
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/couriers/companies" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `GET /couriers/accounts/:storeId`
List configured carrier accounts for a store.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/couriers/accounts/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `POST /couriers/accounts/:storeId`
Add a new courier account (Credentials encrypted with AES-256).
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/couriers/accounts/<STORE_ID>" \
  -H "Authorization: Bearer <SELLER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "courierCompanyId": "<COURIER_COMPANY_ID>",
    "accountName": "Apex J&T VIP Line",
    "accountNumber": "JT-MA-9920",
    "apiKey": "carrier_secret_api_key_xyz",
    "isDefault": true
  }'
```

---

### `POST /couriers/shipments/:storeId`
Dispatch an order with a courier and generate a normalized tracking waybill.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/couriers/shipments/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<ORDER_ID>",
    "courierAccountId": "<COURIER_ACCOUNT_ID>",
    "shippingCost": 35.0
  }'
```

---

### `POST /couriers/snapshots/:shipmentId`
Post a normalized tracking update snapshot (e.g. from carrier webhook or scraper).
- **Allowed Normalized Statuses**: `created`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `failed_attempt`, `returned`.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/couriers/snapshots/<SHIPMENT_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "normalizedStatus": "delivered",
    "rawStatus": "Delivered to Recipient",
    "location": "Casablanca Hub",
    "description": "Package delivered and cash collected successfully"
  }'
```

---

## 9. WAHA WhatsApp Multi-Session Engine (`/api/whatsapp`)

WAHA runs in Docker on port `3008:3000` (`http://localhost:3008`). Sellers can own and manage multiple WhatsApp phone sessions for customer support, verification agents, and marketing. Sessions are accessible to Sellers, Agents, Managers, Admins, and SuperAdmins.

### `GET /whatsapp/health`
Check WAHA Docker container availability and status.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/whatsapp/health"
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "isAlive": true,
    "version": "2026.1",
    "mode": "docker-live" // or "mock"
  }
}
```

---

### `GET /whatsapp/sessions/:storeId`
List all WhatsApp phone sessions and numbers connected for a store.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/whatsapp/sessions/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `POST /whatsapp/sessions/:storeId`
Register a new WhatsApp phone line session for the store.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/whatsapp/sessions/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+212611223344",
    "label": "Agent Line 02 (Confirmation)",
    "engine": "NOWEB",
    "isDefault": false
  }'
```

---

### `POST /whatsapp/sessions/:storeId/:sessionId/connect`
Connect / start a specific WAHA session and generate QR code for phone pairing.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/whatsapp/sessions/<STORE_ID>/<SESSION_ID>/connect" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "NOWEB"
  }'
```

---

### `POST /whatsapp/sessions/:storeId/:sessionId/default`
Set a session as the primary default dispatch line for the store.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/whatsapp/sessions/<STORE_ID>/<SESSION_ID>/default" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `DELETE /whatsapp/sessions/:storeId/:sessionId`
Stop and remove a WhatsApp phone session.
- **cURL Command**:
```bash
curl -X DELETE "http://localhost:4000/api/whatsapp/sessions/<STORE_ID>/<SESSION_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `GET /whatsapp/status/:storeId`
Check default session connection status (`WORKING`, `SCAN_QR_CODE`, `STOPPED`).
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/whatsapp/status/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `POST /whatsapp/send/:storeId`
Send a direct WhatsApp message to a customer from a specific session (or default if omitted).
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/whatsapp/send/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+212612345678",
    "message": "Hello Youssef! Your order #ORD-1001 has been dispatched with J&T Express.",
    "sessionId": "<OPTIONAL_SESSION_ID>"
  }'
```

---

### `POST /whatsapp/broadcast/:storeId`
Launch a rate-limited broadcast campaign with anti-ban delay throttling.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/whatsapp/broadcast/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekend COD Confirmation Broadcast",
    "templateBody": "Hello! Your package is ready for delivery tomorrow. Please reply YES to confirm.",
    "recipientPhones": ["+212612345678", "+212678912345"],
    "throttleMs": 2000
  }'
```

---

### `GET /whatsapp/logs/:storeId`
Query message delivery logs (`sent`, `delivered`, `read`).
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/whatsapp/logs/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 10. Financial Reconciliation & Remittances (`/api/reconciliation`)

### `POST /reconciliation/upload/:storeId`
Upload and parse courier remittance cash statement. Automatically matches orders by `trackingNumber`, compares expected COD amount against cash received, and identifies discrepancies.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/reconciliation/upload/<STORE_ID>" \
  -H "Authorization: Bearer <SELLER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "JT_payout_batch_01.csv",
    "rows": [
      {
        "trackingNumber": "JT99281730MA",
        "remittedAmount": 720.0,
        "carrierStatus": "DELIVERED",
        "notes": "Delivered on 09/10"
      },
      {
        "trackingNumber": "JT99281726MA",
        "remittedAmount": 260.0,
        "carrierStatus": "DELIVERED",
        "notes": "Underpayment shortfall"
      }
    ]
  }'
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "recon-file-01",
    "fileName": "JT_payout_batch_01.csv",
    "status": "completed",
    "totalRows": 2,
    "matchedRows": 1,
    "discrepancyRows": 1,
    "totalRemittedAmount": 980.0
  }
}
```

---

### `GET /reconciliation/discrepancies/:storeId`
List flagged payout discrepancies (`underpayment`, `overpayment`, `ghost_shipment`, `uncollected_returned`).
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/reconciliation/discrepancies/<STORE_ID>?status=open" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `PATCH /reconciliation/discrepancies/:storeId/:discrepancyId/resolve`
Resolve a flagged discrepancy.
- **Allowed Resolutions**: `resolved`, `carrier_refunded`, `accepted_loss`, `investigating`.
- **cURL Command**:
```bash
curl -X PATCH "http://localhost:4000/api/reconciliation/discrepancies/<STORE_ID>/<DISCREPANCY_ID>/resolve" \
  -H "Authorization: Bearer <SELLER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "resolutionStatus": "resolved",
    "resolutionNotes": "Carrier confirmed shortfall credit in next remittance batch"
  }'
```

---

## 11. Analytics & Platform Audits (`/api/analytics`)

### `GET /analytics/metrics/:storeId`
Calculate executive store KPIs: confirmation rate, delivery success %, return rate %, net cash collected, and total COD in pipeline.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/analytics/metrics/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `GET /analytics/agents/:storeId`
Get call center agent conversion performance leaderboard.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/analytics/agents/<STORE_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `GET /analytics/audit`
Query system audit trail.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/analytics/audit?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 12. Staff & User Administration (`/api/admin`)

*Guarded strictly for `SuperAdmin` and `Admin`.*

### `GET /admin/users`
List platform users with store assignments and role filter.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### `POST /admin/users`
Register a staff team member (`Agent`, `Manager`, `Moderator`, or `Admin`).
- **Hierarchy Rules**:
  - `SuperAdmin` can register: `Admin`, `Manager`, `Moderator`, `Agent`.
  - `Admin` can register: `Manager`, `Moderator`, `Agent` (cannot register Admins or SuperAdmins).
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/admin/users" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hamza Radi",
    "email": "hamza.agent@codflow.io",
    "password": "AgentPassword123!",
    "role": "Agent",
    "phoneNumber": "+212611223344",
    "storeId": "<STORE_ID>"
  }'
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u-agent-88",
      "email": "hamza.agent@codflow.io",
      "name": "Hamza Radi",
      "role": "Agent",
      "phoneNumber": "+212611223344",
      "isActive": true
    },
    "assignment": {
      "id": "assign-99",
      "storeId": "<STORE_ID>",
      "assignedRole": "Agent"
    }
  }
}
```

---

### `PATCH /admin/users/:userId/status`
Activate or deactivate a user account.
- **cURL Command**:
```bash
curl -X PATCH "http://localhost:4000/api/admin/users/<USER_ID>/status" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

---

## 13. Store Management & Agent Commission Payouts (`/api/sellers`)

### `PUT /sellers/stores/:storeId/commissions`
Configure agent commission rates for order confirmation and delivered status transitions.
- **Allowed Roles**: `SuperAdmin`, `Admin`, `Seller`, `Manager`.
- **cURL Command**:
```bash
curl -X PUT "http://localhost:4000/api/sellers/stores/<STORE_ID>/commissions" \
  -H "Authorization: Bearer <ADMIN_OR_SELLER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "agentCommissionPerConfirmedOrder": 5.0,
    "agentCommissionPerDeliveredOrder": 15.0
  }'
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "<STORE_ID>",
    "settings": {
      "agentCommissionPerConfirmedOrder": 5.0,
      "agentCommissionPerDeliveredOrder": 15.0
    }
  }
}
```

---

### `GET /sellers/stores/:storeId/agent-commissions`
Retrieve real-time ledger of commissions earned per agent. Tracks how many orders each agent confirmed and how many were finalized as delivered.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/sellers/stores/<STORE_ID>/agent-commissions" \
  -H "Authorization: Bearer <TOKEN>"
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "storeId": "<STORE_ID>",
    "commissionRates": {
      "agentCommissionPerConfirmedOrder": 5,
      "agentCommissionPerDeliveredOrder": 15,
      "currency": "MAD"
    },
    "agents": [
      {
        "agentId": "ag-1234",
        "agentName": "Salma Mansouri (Agent 01)",
        "agentEmail": "agent@codflow.io",
        "role": "Agent",
        "ordersHandled": 28,
        "confirmedCount": 24,
        "deliveredCount": 20,
        "totalCommissionEarned": 420.0,
        "currency": "MAD"
      }
    ]
  }
}
```

---

### `GET /sellers/stores/:storeId/agents`
List all staff assigned to a specific store.
- **cURL Command**:
```bash
curl -X GET "http://localhost:4000/api/sellers/stores/<STORE_ID>/agents" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### `POST /sellers/stores/:storeId/assign`
Assign an agent, manager, or moderator to a store.
- **Allowed Roles**: `SuperAdmin`, `Admin`, `Seller`, `Manager`.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/sellers/stores/<STORE_ID>/assign" \
  -H "Authorization: Bearer <ADMIN_OR_SELLER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>",
    "role": "Agent"
  }'
```

---

## 13. Store & E-commerce Integrations (`/api/webhooks`)

COD Flow includes a universal multi-vocabulary adapter normalizing payloads from 10 store platforms into canonical COD Flow orders.

### 1. Google Sheets Column Matcher (`POST /webhooks/google-sheets/map-columns`)
Intelligently inspects sheet headers and sample rows to match them with canonical fields (`customerName`, `customerPhone`, `city`, `shippingAddress`, `codAmount`, `productName`, `quantity`, `notes`).
- **Cost-Optimization Constraint**: The API reads at most **10 sample rows** to strictly minimize LLM token consumption. Uses Gemini 1.5 Flash when `GEMINI_API_KEY` is configured, with automatic multilingual heuristic fallback (Arabic, Darija, French, English).
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/google-sheets/map-columns" \
  -H "Content-Type: application/json" \
  -d '{
    "headers": ["Nom Client", "Téléphone", "Ville", "Adresse", "Montant COD", "Produit", "Quantité", "Remarques"],
    "sampleRows": [
      {
        "Nom Client": "Mehdi Berrada",
        "Téléphone": "0661122334",
        "Ville": "Casablanca",
        "Adresse": "Gauthier Rue 5",
        "Montant COD": "450",
        "Produit": "Pack Montre",
        "Quantité": "1",
        "Remarques": "Appeler l apres-midi"
      }
    ]
  }'
```

---

### 2. Google Sheets Row Sync (`POST /webhooks/google-sheets/:storeId/sync`)
Ingests parsed rows into the Order Center using the generated column mapping.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/google-sheets/<STORE_ID>/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "headers": ["Nom Client", "Téléphone", "Ville", "Adresse", "Montant COD", "Produit", "Quantité", "Remarques"],
    "mapping": {
      "customerName": "Nom Client",
      "customerPhone": "Téléphone",
      "city": "Ville",
      "shippingAddress": "Adresse",
      "codAmount": "Montant COD",
      "productName": "Produit",
      "quantity": "Quantité",
      "notes": "Remarques"
    },
    "rows": [
      { "Nom Client": "Yassine B.", "Téléphone": "0661998877", "Ville": "Fès", "Adresse": "Immouzer", "Montant COD": "520", "Produit": "Parfum", "Quantité": "1" }
    ]
  }'
```

---

### 3. Shopify Webhook (`POST /webhooks/shopify/:storeId`)
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/shopify/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 99182371,
    "email": "customer@gmail.com",
    "total_price": "490.00",
    "currency": "MAD",
    "shipping_address": {
      "first_name": "Karim",
      "last_name": "Idrissi",
      "phone": "+212644556677",
      "address1": "Boulevard Zerktouni 12",
      "city": "Casablanca"
    },
    "line_items": [
      { "name": "Premium Wireless Earbuds", "price": "490.00", "quantity": 1 }
    ]
  }'
```

---

### 4. YouCan Webhook (`POST /webhooks/youcan/:storeId`)
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/youcan/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "YC-10928",
    "customer": { "first_name": "Fatima", "last_name": "Zahra", "phone": "0677112233", "address": "Agdal", "city": "Rabat" },
    "total": 350,
    "order_variants": [{ "name": "Robe Soirée", "quantity": 1, "price": 350 }]
  }'
```

---

### 5. Storeep Webhook (`POST /webhooks/storeep/:storeId`)
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/storeep/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "STP-7761",
    "customer": { "name": "Hamid Tazi", "phone": "0612345678", "city": "Marrakech", "address": "Gueliz" },
    "total_amount": 420,
    "items": [{ "name": "Cafetière Espresso", "qty": 1, "price": 420 }]
  }'
```

---

### 6. WooCommerce Webhook (`POST /webhooks/woocommerce/:storeId`)
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/woocommerce/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 8812,
    "billing": { "first_name": "Omar", "last_name": "Mansour", "phone": "0655443322", "city": "Tanger" },
    "shipping": { "address_1": "Malabata Rue 8", "city": "Tanger" },
    "total": "590.00",
    "line_items": [{ "name": "Smart Watch Ultra", "quantity": 1, "price": "590.00" }]
  }'
```

---

### 7. Lightfunnels Webhook (`POST /webhooks/lightfunnels/:storeId`)
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/lightfunnels/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "LF-4412",
    "contact": { "full_name": "Samir El Fassi", "phone": "0688990011" },
    "shipping_address": { "address": "Hay Riad Av Ennakhil", "city": "Rabat" },
    "total": "640",
    "items": [{ "title": "Pack Anti-Chute", "quantity": 2, "price": "320" }]
  }'
```

---

### 8. Storeino Webhook (`POST /webhooks/storeino/:storeId`)
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/storeino/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "STR-9912",
    "shipping": { "firstname": "Nadia", "lastname": "Bennani", "phone": "0622334455", "address": "Medina", "city": "Fès" },
    "total": "280",
    "products": [{ "title": "Tapis Berbère Mini", "quantity": 1, "price": "280" }]
  }'
```

---

### 9. EasyOrders Webhook (`POST /webhooks/easyorders/:storeId`)
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/easyorders/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "EO-5541",
    "client_name": "Rachid Daoudi",
    "client_phone": "0677889900",
    "client_city": "Agadir",
    "client_address": "Sonaba",
    "total_price": "390",
    "products": [{ "name": "Brosse Chauffante", "quantity": 1, "price": "390" }]
  }'
```

---

### 10. Magento Webhook (`POST /webhooks/magento/:storeId`)
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/magento/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "MAG-3301",
    "customer_firstname": "Adil",
    "customer_lastname": "Cherkaoui",
    "billing_address": { "telephone": "0611223344" },
    "shipping_address": { "street": ["Boulevard Al Quds 14"], "city": "Casablanca" },
    "grand_total": 750,
    "items": [{ "name": "Set Valises Rigides", "qty_ordered": 1, "price": 750 }]
  }'
```

---

### 11. Simple / Custom API (`POST /webhooks/api/:storeId`)
Accepts direct arbitrary JSON with Moroccan/English/French aliased field names.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/webhooks/api/<STORE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Salim Tazi",
    "gsm": "0666112233",
    "ville": "Casablanca",
    "adresse": "Maarif Rue 4",
    "prix": 490,
    "produit": "Diffuseur Huiles Essentielles"
  }'
```

---

## 14. Shipping Companies & Inbound Tracking (`/api/couriers`)

Unified status normalizer across 10 Moroccan & MENA logistics providers:
- `IRSALIYAT` (`irsaliyat`)
- `ONESSTA` (`onessta`)
- `FORCELOG` (`forcelog`)
- `AMEEX` (`ameex`)
- `CATHEDIS` (`cathedis`)
- `CHRONO DIALI` (`chrono_diali`)
- `SENDIT` (`sendit`)
- `OZON EXPRESS` (`ozon_express`)
- `DIGYLOG` (`digylog`)
- `KARGO EXPRESS` (`kargo_express`)

### Courier Inbound Webhook (`POST /couriers/webhook/:courierCode`)
Configured in each carrier's merchant portal to receive status callbacks. Translates varied vocabularies (`LIVRÉ`, `EN_DISTRIBUTION`, `RETOUR`, `CMD_CREEE`, `Enlevement`, `Refusé`) into canonical order lifecycle events.
- **cURL Command**:
```bash
curl -X POST "http://localhost:4000/api/couriers/webhook/irsaliyat" \
  -H "Content-Type: application/json" \
  -d '{
    "tracking_id": "TR10029381",
    "statut": "LIVRÉ",
    "ville": "Casablanca Hub",
    "montant_encaisse": 490.0,
    "commentaire": "Colis remis au client avec encaissement CRBT"
  }'
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "received": true,
    "matched": true,
    "shipmentId": "...",
    "trackingNumber": "TR10029381",
    "canonicalStatus": "delivered"
  }
}
```

---

## 15. Pristine Testing Seller Account Credentials

Use these credentials to test all store integrations and order flows without any dummy data:
- **Email**: `seller.live@codflow.io`
- **Password**: `LiveSellerPass2026!`
- **Role**: `Seller`
- **Store**: `Atlas Commerce Live` (`atlas-live`, Currency: `MAD`)
- **Initial Orders**: `0` (Completely empty and pristine)

---

## 16. WhatsApp Integration & WAHA Engine (QR Code, Chats, Messages)

All WhatsApp interactions interface with the **WAHA (WhatsApp HTTP API)** engine (`https://waha.devlike.pro/docs/`).

### `GET /whatsapp/health`
Check WAHA engine connectivity and status.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "engine": "WAHA (WhatsApp HTTP API)",
    "status": "healthy",
    "mode": "live",
    "version": "2026.x"
  }
}
```

### `GET /whatsapp/sessions/:storeId`
List all phone sessions configured for the merchant's store.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "wa-session-uuid",
      "sessionId": "store-atlas-live-primary",
      "sessionName": "Atlas Primary Line",
      "phoneNumber": "+212600112233",
      "status": "WORKING",
      "connectedPhone": "212600112233",
      "isDefault": true,
      "updatedAt": "2026-09-13T01:20:00.000Z"
    }
  ]
}
```

### `POST /whatsapp/sessions/:storeId`
Register and launch a new WhatsApp phone session in WAHA.
- **Headers**: `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Customer Support Desk",
  "phoneNumber": "+212655443322"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "sessionId": "store-atlas-live-custom-1234",
    "sessionName": "Customer Support Desk",
    "status": "SCAN_QR_CODE",
    "qr": "data:image/png;base64,..."
  }
}
```

### `GET /whatsapp/sessions/:storeId/:sessionId/qr`
Fetch the active QR code to pair WhatsApp on your phone (`data:image/png;base64,...` or SVG data URL).
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "sessionId": "store-atlas-live-custom-1234",
    "sessionName": "Customer Support Desk",
    "status": "SCAN_QR_CODE",
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "error": null
  }
}
```

### `GET /whatsapp/sessions/:storeId/:sessionId/chats`
Retrieve list of active chat conversations from WAHA.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "212612345678@c.us",
      "name": "Karim Bennani",
      "unreadCount": 1,
      "timestamp": 1789255000,
      "lastMessage": {
        "body": "Je confirme ma commande pour Casablanca",
        "timestamp": 1789255000,
        "fromMe": false
      }
    }
  ]
}
```

### `GET /whatsapp/sessions/:storeId/:sessionId/contacts`
Retrieve contacts directory from WAHA phonebook.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "212612345678@c.us",
      "name": "Karim Bennani",
      "pushname": "Karim B",
      "number": "+212612345678"
    }
  ]
}
```

### `GET /whatsapp/sessions/:storeId/:sessionId/chats/:chatId/messages`
Fetch chat message history for a specific conversation thread.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Query Params**: `limit=50` (optional)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_001",
      "chatId": "212612345678@c.us",
      "from": "store-session",
      "to": "212612345678@c.us",
      "body": "Bonjour Karim, votre commande est en cours de préparation.",
      "timestamp": 1789254800,
      "fromMe": true
    },
    {
      "id": "msg_002",
      "chatId": "212612345678@c.us",
      "from": "212612345678@c.us",
      "to": "store-session",
      "body": "Parfait merci beaucoup !",
      "timestamp": 1789254900,
      "fromMe": false
    }
  ]
}
```

### `POST /whatsapp/sessions/:storeId/:sessionId/send`
Send an instant WhatsApp message to any customer phone number.
- **Headers**: `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`
- **Request Body**:
```json
{
  "chatId": "212612345678@c.us",
  "text": "Votre colis a été expédié avec Irsaliyat ! Suivi : TR992019"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "messageId": "wamid.HBgLMjEyNjEyMzQ1Njc4FQIAERgSMzAy...=",
    "status": "SENT"
  }
}
```

### `POST /whatsapp/broadcast/:storeId`
Send automated order updates or marketing broadcast campaigns to a list of recipients.
- **Headers**: `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`
- **Request Body**:
```json
{
  "recipients": ["+212612345678", "+212698765432"],
  "messageTemplate": "Bonjour {{name}}, profitez de 20% sur votre commande!",
  "campaignName": "Spring Sale Flash"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "batchId": "bch_00192",
    "totalQueued": 2,
    "status": "PROCESSING"
  }
}
```



