import request from 'supertest';
import { createApp } from '../src/app';
import { initializeDatabase, AppDataSource } from '../src/database/dataSource';
import { seedDatabase } from '../src/database/seed';
import { OrderStatusEnum, CallOutcomeEnum, DiscrepancyResolutionEnum } from '../src/database/entities';

let app: any;
let adminToken: string;
let sellerToken: string;
let agentToken: string;
let testStoreId: string;

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();
  app = createApp();

  // Login as admin
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@codflow.io',
    password: 'AdminPass123!',
  });
  adminToken = adminLogin.body.data.token;

  // Login as seller
  const sellerLogin = await request(app).post('/api/auth/login').send({
    email: 'seller@codflow.io',
    password: 'SellerPass123!',
  });
  sellerToken = sellerLogin.body.data.token;
  testStoreId = sellerLogin.body.data.stores[0].id;

  // Login as agent
  const agentLogin = await request(app).post('/api/auth/login').send({
    email: 'agent@codflow.io',
    password: 'AgentPass123!',
  });
  agentToken = agentLogin.body.data.token;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

describe('COD Flow Backend API Test Suite', () => {
  // 1. Health Check
  describe('GET /api/health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toContain('COD Flow');
    });
  });

  // 2. Authentication & RBAC
  describe('Authentication & RBAC', () => {
    it('should authenticate user and return profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('seller@codflow.io');
    });

    it('should block unauthenticated requests', async () => {
      const res = await request(app).get(`/api/orders/${testStoreId}`);
      expect(res.status).toBe(401);
    });

    it('should prevent agent from creating stores (RBAC test)', async () => {
      const res = await request(app)
        .post(`/api/sellers/dummy-id/stores`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ name: 'Illegal Store', slug: 'illegal-store' });
      expect(res.status).toBe(403);
    });
  });

  // 3. Orders Lifecycle & State Transitions
  describe('Orders Module', () => {
    let createdOrderId: string;

    it('should list store orders', async () => {
      const res = await request(app)
        .get(`/api/orders/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.orders.length).toBeGreaterThan(0);
    });

    it('should create a new manual COD order', async () => {
      const res = await request(app)
        .post(`/api/orders/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          customerName: 'Samir Alami',
          customerPhone: '+212661223344',
          city: 'Fes',
          shippingAddress: 'Avenue Hassan II, Fes',
          subtotal: 450,
          shippingFee: 30,
          codAmount: 480,
          items: [{ productName: 'Smart Vacuum Robot', quantity: 1, unitPrice: 450, totalPrice: 450 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.customerName).toBe('Samir Alami');
      expect(res.body.data.status).toBe(OrderStatusEnum.PENDING_VERIFICATION);
      expect(res.body.data.codAmount).toBe(480);
      createdOrderId = res.body.data.id;
    });

    it('should transition order status to confirmed with audit trail', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testStoreId}/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          status: OrderStatusEnum.CONFIRMED,
          notes: 'Customer confirmed verbally on call',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(OrderStatusEnum.CONFIRMED);
    });
  });

  // 4. Webhook Ingestion
  describe('Webhook Ingestion', () => {
    it('should ingest Shopify order webhook', async () => {
      const payload = {
        id: 99182371,
        email: 'shopify_buyer@test.com',
        total_price: '650.00',
        subtotal_price: '600.00',
        shipping_address: {
          first_name: 'Karim',
          last_name: 'Idrissi',
          phone: '+212644556677',
          city: 'Agadir',
          address1: 'Boulevard 20 Aout',
        },
        line_items: [
          { name: 'Wireless Ergonomic Keyboard', quantity: 1, price: '600.00' },
        ],
      };

      const res = await request(app)
        .post(`/api/webhooks/shopify/${testStoreId}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orderId).toBeDefined();
    });
  });

  // 5. Call Center Operations
  describe('Call Center Module', () => {
    it('should retrieve pending queue for verification agent', async () => {
      const res = await request(app)
        .get(`/api/call-center/queue/${testStoreId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should record call attempt and trigger automated WhatsApp on no_answer', async () => {
      // First get an order from queue
      const queueRes = await request(app)
        .get(`/api/call-center/queue/${testStoreId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      const targetOrder = queueRes.body.data[0];

      const res = await request(app)
        .post(`/api/call-center/calls/${testStoreId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          orderId: targetOrder.id,
          outcome: CallOutcomeEnum.NO_ANSWER,
          durationSeconds: 25,
          notes: 'Customer phone rang with no answer',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.callLog.outcome).toBe(CallOutcomeEnum.NO_ANSWER);
      expect(res.body.data.whatsappTriggered).toBe(true);
    });
  });

  // 6. Courier & Logistics
  describe('Courier Module', () => {
    it('should list available courier accounts', async () => {
      const res = await request(app)
        .get(`/api/couriers/accounts/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should dispatch an order and normalize tracking snapshot', async () => {
      // List orders to pick one
      const ordersRes = await request(app)
        .get(`/api/orders/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      const order = ordersRes.body.data.orders[0];

      const accountsRes = await request(app)
        .get(`/api/couriers/accounts/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      const courierAccountId = accountsRes.body.data[0].id;

      const res = await request(app)
        .post(`/api/couriers/shipments/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          orderId: order.id,
          courierAccountId,
          shippingCost: 35.0,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.trackingNumber).toBeDefined();
      expect(res.body.data.status).toBe('created');
    });
  });

  // 7. WAHA WhatsApp Engine
  describe('WhatsApp (WAHA) Module', () => {
    it('should query WAHA connection status', async () => {
      const res = await request(app)
        .get(`/api/whatsapp/status/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.sessionName).toBeDefined();
    });

    it('should dispatch a template message via WAHA client', async () => {
      const res = await request(app)
        .post(`/api/whatsapp/send/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          to: '+212612345678',
          message: 'Hello! Your order has been dispatched.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('sent');
      expect(res.body.data.externalMessageId).toBeDefined();
    });
  });

  // 8. Financial Reconciliation
  describe('Financial Reconciliation Module', () => {
    it('should process remittance file and identify matched and discrepancy orders', async () => {
      // Find an existing delivered order to test exact match
      const ordersRes = await request(app)
        .get(`/api/orders/${testStoreId}?status=delivered`)
        .set('Authorization', `Bearer ${sellerToken}`);

      const deliveredOrder = ordersRes.body.data.orders[0];
      const trackingNumber = deliveredOrder?.trackingNumber || 'JT99281730MA';
      const expectedAmount = deliveredOrder?.codAmount || 720;

      const remittancePayload = {
        fileName: 'JT_remittance_sep_2026.csv',
        rows: [
          // Row 1: Exact match
          {
            trackingNumber: trackingNumber,
            remittedAmount: expectedAmount,
            carrierStatus: 'DELIVERED',
            notes: 'Batch #2026-09-A',
          },
          // Row 2: Underpayment discrepancy
          {
            trackingNumber: 'ORD-FAKE-999',
            remittedAmount: 150,
            carrierStatus: 'DELIVERED',
            notes: 'Ghost parcel',
          },
        ],
      };

      const res = await request(app)
        .post(`/api/reconciliation/upload/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(remittancePayload);

      expect(res.status).toBe(201);
      expect(res.body.data.totalRows).toBe(2);
      expect(res.body.data.matchedRows).toBe(1);
      expect(res.body.data.discrepancyRows).toBe(1);
    });

    it('should list open payout discrepancies and allow resolution', async () => {
      const listRes = await request(app)
        .get(`/api/reconciliation/discrepancies/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      const discrepancy = listRes.body.data[0];

      // Resolve it
      const resolveRes = await request(app)
        .patch(`/api/reconciliation/discrepancies/${testStoreId}/${discrepancy.id}/resolve`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          resolutionStatus: DiscrepancyResolutionEnum.RESOLVED,
          resolutionNotes: 'Carrier acknowledged dispute and issued refund voucher',
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.resolutionStatus).toBe(DiscrepancyResolutionEnum.RESOLVED);
    });
  });

  // 9. Analytics & KPIs
  describe('Analytics Module', () => {
    it('should aggregate store KPIs correctly', async () => {
      const res = await request(app)
        .get(`/api/analytics/metrics/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalOrders).toBeGreaterThan(0);
      expect(res.body.data.totalCodPipeline).toBeGreaterThan(0);
      expect(res.body.data.confirmationRate).toBeDefined();
      expect(res.body.data.deliverySuccessRate).toBeDefined();
    });
  });

  // 10. Multi-Session WhatsApp & Agent Commissions
  describe('Multi-Session WhatsApp & Agent Commissions', () => {
    it('should configure agent commissions and retrieve agent commission breakdown', async () => {
      // Configure commissions as Seller
      const updateRes = await request(app)
        .put(`/api/sellers/stores/${testStoreId}/commissions`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          agentCommissionPerConfirmedOrder: 7.5,
          agentCommissionPerDeliveredOrder: 20,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.settings.agentCommissionPerConfirmedOrder).toBe(7.5);

      // Fetch commission report
      const commRes = await request(app)
        .get(`/api/sellers/stores/${testStoreId}/agent-commissions`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(commRes.status).toBe(200);
      expect(commRes.body.data.commissionRates.agentCommissionPerConfirmedOrder).toBe(7.5);
      expect(commRes.body.data.commissionRates.agentCommissionPerDeliveredOrder).toBe(20);
      expect(Array.isArray(commRes.body.data.agents)).toBe(true);
    });

    it('should list and create multiple WhatsApp sessions per store', async () => {
      // List sessions
      const listRes = await request(app)
        .get(`/api/whatsapp/sessions/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.length).toBeGreaterThan(0);

      // Create a secondary line
      const testPhone = `212611${Date.now().toString().slice(-6)}`;
      const createRes = await request(app)
        .post(`/api/whatsapp/sessions/${testStoreId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          phoneNumber: `+${testPhone}`,
          label: 'Customer Support Line 2',
          engine: 'NOWEB',
        });

      expect([200, 201]).toContain(createRes.status);
      expect(createRes.body.data.label).toBe('Customer Support Line 2');
      expect(createRes.body.data.connectedPhone).toBe(testPhone);

      // Check health endpoint
      const healthRes = await request(app).get('/api/whatsapp/health');
      expect(healthRes.status).toBe(200);
      expect(healthRes.body.data.isAlive).toBe(true);
    });
  });
});
