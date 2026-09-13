import bcrypt from 'bcryptjs';
import { AppDataSource, initializeDatabase } from './dataSource';
import {
  User,
  UserRoleEnum,
  Role,
  Seller,
  Store,
  UserStoreAssignment,
  StoreIntegrationProvider,
  CourierCompany,
  CourierAccount,
  CancellationReason,
  Order,
  OrderStatusEnum,
  OrderItem,
  OrderStatusHistory,
  WhatsAppConnection,
  WhatsAppStatusEnum,
} from './entities';
import { logger } from '../utils/logger';

export async function seedDatabase() {
  await initializeDatabase();
  const userRepo = AppDataSource.getRepository(User);
  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@codflow.io' } });

  if (existingAdmin) {
    logger.info('Database seeded, ensuring latest providers, couriers and clean seller exist...');
    await ensureLatestData();
    return;
  }

  logger.info('Seeding database with initial default data...');

  // 1. Roles
  const roleRepo = AppDataSource.getRepository(Role);
  const roles = [
    { name: 'SuperAdmin', description: 'Master platform god-mode administrator' },
    { name: 'Admin', description: 'Platform administration and team management' },
    { name: 'Moderator', description: 'Operational oversight across tenants' },
    { name: 'Manager', description: 'Store team lead & queue manager' },
    { name: 'Agent', description: 'Call center verification representative' },
    { name: 'Seller', description: 'Merchant store owner' },
  ];
  for (const r of roles) {
    await roleRepo.save(roleRepo.create(r));
  }

  // 2. Integration Providers (10 Storefronts)
  const providerRepo = AppDataSource.getRepository(StoreIntegrationProvider);
  const providers = [
    { code: 'google_sheets', name: 'Google Sheets (AI Column Matcher)', supportedFeatures: ['orders', 'import', 'ai_mapping'] },
    { code: 'shopify', name: 'Shopify Storefront', supportedFeatures: ['orders', 'products', 'webhooks'] },
    { code: 'youcan', name: 'YouCan Shop', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'storeep', name: 'Storeep Platform', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'woocommerce', name: 'WooCommerce Store', supportedFeatures: ['orders', 'products', 'webhooks'] },
    { code: 'lightfunnels', name: 'Lightfunnels Funnels', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'storeino', name: 'Storeino Store', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'easyorders', name: 'EasyOrders COD', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'magento', name: 'Magento 2 E-Commerce', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'custom_api', name: 'Simple API / Custom Webhook', supportedFeatures: ['orders', 'webhooks', 'rest'] },
  ];
  for (const p of providers) {
    await providerRepo.save(providerRepo.create(p));
  }

  // 3. Courier Companies (10 Moroccan/MENA Couriers + J&T & DHL)
  const courierRepo = AppDataSource.getRepository(CourierCompany);
  const couriers = [
    { code: 'irsaliyat', name: 'IRSALIYAT Express', trackingUrlTemplate: 'https://irsaliyat.com/tracking?ref={trackingNumber}' },
    { code: 'onessta', name: 'ONESSTA Logistics', trackingUrlTemplate: 'https://onessta.ma/track/{trackingNumber}' },
    { code: 'forcelog', name: 'FORCELOG Delivery', trackingUrlTemplate: 'https://forcelog.ma/suivi/{trackingNumber}' },
    { code: 'ameex', name: 'AMEEX Delivery', trackingUrlTemplate: 'https://ameex.ma/track?code={trackingNumber}' },
    { code: 'cathedis', name: 'CATHEDIS Express', trackingUrlTemplate: 'https://cathedis.ma/suivi/{trackingNumber}' },
    { code: 'chrono_diali', name: 'CHRONO DIALI', trackingUrlTemplate: 'https://chronodiali.ma/suivi?colis={trackingNumber}' },
    { code: 'sendit', name: 'SENDIT Express', trackingUrlTemplate: 'https://sendit.ma/track/{trackingNumber}' },
    { code: 'ozon_express', name: 'OZON EXPRESS', trackingUrlTemplate: 'https://ozonexpress.ma/suivi/{trackingNumber}' },
    { code: 'digylog', name: 'DIGYLOG Logistics', trackingUrlTemplate: 'https://digylog.ma/suivi/{trackingNumber}' },
    { code: 'kargo_express', name: 'KARGO EXPRESS', trackingUrlTemplate: 'https://kargoexpress.ma/track/{trackingNumber}' },
    { code: 'jt_express', name: 'J&T Express', trackingUrlTemplate: 'https://www.jtexpress.com/track?billcode={trackingNumber}' },
    { code: 'dhl', name: 'DHL Express', trackingUrlTemplate: 'https://www.dhl.com/track?tracking-id={trackingNumber}' },
    { code: 'ninjavan', name: 'Ninja Van', trackingUrlTemplate: 'https://www.ninjavan.co/track?id={trackingNumber}' },
  ];
  for (const c of couriers) {
    await courierRepo.save(courierRepo.create(c));
  }

  // 4. Cancellation Reasons
  const cancelRepo = AppDataSource.getRepository(CancellationReason);
  const cancelReasons = [
    { code: 'customer_refused', label: 'Customer Refused Order' },
    { code: 'unreachable', label: 'Customer Unreachable After Max Attempts' },
    { code: 'wrong_address', label: 'Invalid or Undeliverable Address' },
    { code: 'fake_lead', label: 'Suspected Fraud or Fake Lead' },
    { code: 'duplicate', label: 'Duplicate Order Intake' },
    { code: 'out_of_stock', label: 'Product Out of Stock' },
  ];
  for (const cr of cancelReasons) {
    await cancelRepo.save(cancelRepo.create(cr));
  }

  // 5. Users: SuperAdmin, Admin, Seller, Agent
  const salt = await bcrypt.genSalt(10);
  const superAdminPassword = await bcrypt.hash('SuperAdminPass123!', salt);
  const adminPassword = await bcrypt.hash('AdminPass123!', salt);
  const sellerPassword = await bcrypt.hash('SellerPass123!', salt);
  const agentPassword = await bcrypt.hash('AgentPass123!', salt);

  const superAdmin = await userRepo.save(
    userRepo.create({
      email: 'superadmin@codflow.io',
      name: 'Master Platform SuperAdmin',
      passwordHash: superAdminPassword,
      role: UserRoleEnum.SUPERADMIN,
      phoneNumber: '+10000000000',
    })
  );

  const admin = await userRepo.save(
    userRepo.create({
      email: 'admin@codflow.io',
      name: 'Operations Admin',
      passwordHash: adminPassword,
      role: UserRoleEnum.ADMIN,
      phoneNumber: '+10000000001',
    })
  );

  const sellerUser = await userRepo.save(
    userRepo.create({
      email: 'seller@codflow.io',
      name: 'Tariq Benali (Apex Traders)',
      passwordHash: sellerPassword,
      role: UserRoleEnum.SELLER,
      phoneNumber: '+212600112233',
    })
  );

  const agentUser = await userRepo.save(
    userRepo.create({
      email: 'agent@codflow.io',
      name: 'Salma Mansouri (Agent 01)',
      passwordHash: agentPassword,
      role: UserRoleEnum.AGENT,
      phoneNumber: '+212699887766',
    })
  );

  // 6. Seller & Store
  const sellerRepo = AppDataSource.getRepository(Seller);
  const seller = await sellerRepo.save(
    sellerRepo.create({
      companyName: 'Apex COD Global Trading',
      country: 'Morocco',
      taxNumber: 'MA-99281920',
      contactPhone: '+212600112233',
      ownerUserId: sellerUser.id,
    })
  );

  const storeRepo = AppDataSource.getRepository(Store);
  const store = await storeRepo.save(
    storeRepo.create({
      name: 'Apex Casablanca Store',
      slug: 'apex-casablanca',
      currency: 'MAD',
      locale: 'fr',
      timezone: 'Africa/Casablanca',
      sellerId: seller.id,
      settings: {
        autoTriggerWhatsAppOnNoAnswer: true,
        maxCallAttempts: 4,
      },
    })
  );

  // 7. Store Assignments
  const assignRepo = AppDataSource.getRepository(UserStoreAssignment);
  await assignRepo.save(
    assignRepo.create({
      userId: agentUser.id,
      storeId: store.id,
      assignedRole: 'Agent',
    })
  );
  await assignRepo.save(
    assignRepo.create({
      userId: sellerUser.id,
      storeId: store.id,
      assignedRole: 'Seller',
    })
  );

  // 8. Courier Account
  const jtCourier = await courierRepo.findOne({ where: { code: 'jt_express' } });
  const courierAccountRepo = AppDataSource.getRepository(CourierAccount);
  let courierAccount;
  if (jtCourier) {
    courierAccount = await courierAccountRepo.save(
      courierAccountRepo.create({
        storeId: store.id,
        courierCompanyId: jtCourier.id,
        accountName: 'Apex J&T VIP Account',
        accountNumber: 'JT-MA-9920',
        isDefault: true,
      })
    );
  }

  // 9. WhatsApp Connection (WAHA)
  const waRepo = AppDataSource.getRepository(WhatsAppConnection);
  await waRepo.save(
    waRepo.create({
      storeId: store.id,
      sessionName: `apex-casablanca-session`,
      engine: 'NOWEB',
      status: WhatsAppStatusEnum.WORKING,
      connectedPhone: '+212600112233',
      isDefault: true,
    })
  );

  // 10. Sample COD Orders
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const historyRepo = AppDataSource.getRepository(OrderStatusHistory);

  const sampleOrders = [
    {
      storeId: store.id,
      orderNumber: 'ORD-1001',
      status: OrderStatusEnum.PENDING_VERIFICATION,
      customerName: 'Youssef El Amrani',
      customerPhone: '+212612345678',
      city: 'Casablanca',
      province: 'Grand Casablanca',
      shippingAddress: 'Boulevard d Anfa, Appt 14, Casablanca',
      subtotal: 390.0,
      shippingFee: 35.0,
      codAmount: 425.0,
      currency: 'MAD',
      assignedAgentId: agentUser.id,
      callAttemptsCount: 0,
      source: 'shopify',
      notes: 'Customer asked for afternoon delivery if verified',
      items: [{ productName: 'Ultra Wireless Noise-Cancelling Headphones', quantity: 1, unitPrice: 390.0, totalPrice: 390.0 }],
    },
    {
      storeId: store.id,
      orderNumber: 'ORD-1002',
      status: OrderStatusEnum.CONFIRMED,
      customerName: 'Fatima Zahra Bennani',
      customerPhone: '+212678912345',
      city: 'Rabat',
      province: 'Rabat-Sale-Kenitra',
      shippingAddress: 'Avenue Mohammed VI, Villa 22, Rabat',
      subtotal: 550.0,
      shippingFee: 0.0,
      codAmount: 550.0,
      currency: 'MAD',
      assignedAgentId: agentUser.id,
      callAttemptsCount: 1,
      source: 'woocommerce',
      items: [{ productName: 'Smart Touch Air Fryer 5.5L', quantity: 1, unitPrice: 550.0, totalPrice: 550.0 }],
    },
    {
      storeId: store.id,
      orderNumber: 'ORD-1003',
      status: OrderStatusEnum.SHIPPED,
      customerName: 'Omar Chraibi',
      customerPhone: '+212654321098',
      city: 'Marrakech',
      province: 'Marrakech-Safi',
      shippingAddress: 'Gueliz, Rue de la Liberte, Marrakech',
      subtotal: 280.0,
      shippingFee: 35.0,
      codAmount: 315.0,
      currency: 'MAD',
      source: 'youcan',
      trackingNumber: 'JT99281726MA',
      courierName: 'J&T Express',
      items: [{ productName: 'Men Vintage Chrono Leather Watch', quantity: 1, unitPrice: 280.0, totalPrice: 280.0 }],
    },
    {
      storeId: store.id,
      orderNumber: 'ORD-1004',
      status: OrderStatusEnum.DELIVERED,
      customerName: 'Khadija Mansour',
      customerPhone: '+212622446688',
      city: 'Tangier',
      province: 'Tanger-Tetouan-Al Hoceima',
      shippingAddress: 'Malabata Beach Residence, Tangier',
      subtotal: 720.0,
      shippingFee: 0.0,
      codAmount: 720.0,
      currency: 'MAD',
      source: 'shopify',
      trackingNumber: 'JT99281730MA',
      courierName: 'J&T Express',
      items: [{ productName: 'Professional Hair Styling Kit Deluxe', quantity: 1, unitPrice: 720.0, totalPrice: 720.0 }],
    },
  ];

  for (const o of sampleOrders) {
    const { items, ...orderData } = o;
    const createdOrder = await orderRepo.save(orderRepo.create(orderData));
    for (const item of items) {
      await orderItemRepo.save(
        orderItemRepo.create({
          orderId: createdOrder.id,
          ...item,
        })
      );
    }
    await historyRepo.save(
      historyRepo.create({
        orderId: createdOrder.id,
        previousStatus: 'created',
        newStatus: createdOrder.status,
        changedByName: 'System Ingestion',
        notes: `Initial order ingestion from ${createdOrder.source}`,
      })
    );
  }

  logger.info('Database seeded successfully with users, stores, couriers, and sample orders.');
  await ensureLatestData();
}

export async function ensureLatestData() {
  const providerRepo = AppDataSource.getRepository(StoreIntegrationProvider);
  const providers = [
    { code: 'google_sheets', name: 'Google Sheets (AI Column Matcher)', supportedFeatures: ['orders', 'import', 'ai_mapping'] },
    { code: 'shopify', name: 'Shopify Storefront', supportedFeatures: ['orders', 'products', 'webhooks'] },
    { code: 'youcan', name: 'YouCan Shop', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'storeep', name: 'Storeep Platform', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'woocommerce', name: 'WooCommerce Store', supportedFeatures: ['orders', 'products', 'webhooks'] },
    { code: 'lightfunnels', name: 'Lightfunnels Funnels', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'storeino', name: 'Storeino Store', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'easyorders', name: 'EasyOrders COD', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'magento', name: 'Magento 2 E-Commerce', supportedFeatures: ['orders', 'webhooks'] },
    { code: 'custom_api', name: 'Simple API / Custom Webhook', supportedFeatures: ['orders', 'webhooks', 'rest'] },
  ];
  for (const p of providers) {
    const exists = await providerRepo.findOne({ where: { code: p.code } });
    if (!exists) {
      await providerRepo.save(providerRepo.create(p));
    }
  }

  const courierRepo = AppDataSource.getRepository(CourierCompany);
  const couriers = [
    { code: 'irsaliyat', name: 'IRSALIYAT Express', trackingUrlTemplate: 'https://irsaliyat.com/tracking?ref={trackingNumber}' },
    { code: 'onessta', name: 'ONESSTA Logistics', trackingUrlTemplate: 'https://onessta.ma/track/{trackingNumber}' },
    { code: 'forcelog', name: 'FORCELOG Delivery', trackingUrlTemplate: 'https://forcelog.ma/suivi/{trackingNumber}' },
    { code: 'ameex', name: 'AMEEX Delivery', trackingUrlTemplate: 'https://ameex.ma/track?code={trackingNumber}' },
    { code: 'cathedis', name: 'CATHEDIS Express', trackingUrlTemplate: 'https://cathedis.ma/suivi/{trackingNumber}' },
    { code: 'chrono_diali', name: 'CHRONO DIALI', trackingUrlTemplate: 'https://chronodiali.ma/suivi?colis={trackingNumber}' },
    { code: 'sendit', name: 'SENDIT Express', trackingUrlTemplate: 'https://sendit.ma/track/{trackingNumber}' },
    { code: 'ozon_express', name: 'OZON EXPRESS', trackingUrlTemplate: 'https://ozonexpress.ma/suivi/{trackingNumber}' },
    { code: 'digylog', name: 'DIGYLOG Logistics', trackingUrlTemplate: 'https://digylog.ma/suivi/{trackingNumber}' },
    { code: 'kargo_express', name: 'KARGO EXPRESS', trackingUrlTemplate: 'https://kargoexpress.ma/track/{trackingNumber}' },
    { code: 'jt_express', name: 'J&T Express', trackingUrlTemplate: 'https://www.jtexpress.com/track?billcode={trackingNumber}' },
    { code: 'dhl', name: 'DHL Express', trackingUrlTemplate: 'https://www.dhl.com/track?tracking-id={trackingNumber}' },
    { code: 'ninjavan', name: 'Ninja Van', trackingUrlTemplate: 'https://www.ninjavan.co/track?id={trackingNumber}' },
  ];
  for (const c of couriers) {
    const exists = await courierRepo.findOne({ where: { code: c.code } });
    if (!exists) {
      await courierRepo.save(courierRepo.create(c));
    }
  }

  // Ensure Clean Seller Account with 0 dummy orders exists
  const userRepo = AppDataSource.getRepository(User);
  const sellerRepo = AppDataSource.getRepository(Seller);
  const storeRepo = AppDataSource.getRepository(Store);
  const assignRepo = AppDataSource.getRepository(UserStoreAssignment);

  let cleanUser = await userRepo.findOne({ where: { email: 'seller.live@codflow.io' } });
  if (!cleanUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('LiveSellerPass2026!', salt);
    cleanUser = await userRepo.save(
      userRepo.create({
        email: 'seller.live@codflow.io',
        name: 'Live Merchant (Clean Testing Account)',
        passwordHash,
        role: UserRoleEnum.SELLER,
        phoneNumber: '+212600998877',
      })
    );
  }

  let cleanSeller = await sellerRepo.findOne({ where: { ownerUserId: cleanUser.id } });
  if (!cleanSeller) {
    cleanSeller = await sellerRepo.save(
      sellerRepo.create({
        companyName: 'Atlas Commerce SARL',
        country: 'Morocco',
        contactPhone: '+212600998877',
        ownerUserId: cleanUser.id,
      })
    );
  }

  let cleanStore = await storeRepo.findOne({ where: { slug: 'atlas-live' } });
  if (!cleanStore) {
    cleanStore = await storeRepo.save(
      storeRepo.create({
        name: 'Atlas Commerce Live',
        slug: 'atlas-live',
        currency: 'MAD',
        locale: 'fr',
        timezone: 'Africa/Casablanca',
        sellerId: cleanSeller.id,
        settings: {
          autoTriggerWhatsAppOnNoAnswer: true,
          agentCommissionPerConfirmedOrder: 5,
          agentCommissionPerDeliveredOrder: 15,
        },
      })
    );

    await assignRepo.save(
      assignRepo.create({
        userId: cleanUser.id,
        storeId: cleanStore.id,
        assignedRole: 'Seller',
      })
    );
    logger.info('Clean testing seller account and store provisioned: seller.live@codflow.io / LiveSellerPass2026!');
  }

  // Ensure each seller has at least one assigned agent: Provision dedicated agent for Live Merchant
  let liveAgentUser = await userRepo.findOne({ where: { email: 'agent.live@codflow.io' } });
  if (!liveAgentUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('LiveAgentPass2026!', salt);
    liveAgentUser = await userRepo.save(
      userRepo.create({
        email: 'agent.live@codflow.io',
        name: 'Amina El Alami (Live Assigned Agent)',
        passwordHash,
        role: UserRoleEnum.AGENT,
        phoneNumber: '+212611223344',
      })
    );
    logger.info('Clean testing agent account provisioned: agent.live@codflow.io / LiveAgentPass2026!');
  }

  // Ensure assignment to Atlas Commerce Live store
  const liveStore = await storeRepo.findOne({ where: { slug: 'atlas-live' } });
  if (liveStore && liveAgentUser) {
    const existingAssign = await assignRepo.findOne({
      where: { userId: liveAgentUser.id, storeId: liveStore.id },
    });
    if (!existingAssign) {
      await assignRepo.save(
        assignRepo.create({
          userId: liveAgentUser.id,
          storeId: liveStore.id,
          assignedRole: 'Agent',
        })
      );
      logger.info(`Assigned agent.live@codflow.io to store '${liveStore.name}' (${liveStore.id})`);
    }
  }

  // Ensure Master SuperAdmin account exists
  let saUser = await userRepo.findOne({ where: { email: 'superadmin@codflow.io' } });
  if (!saUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('SuperAdminPass123!', salt);
    saUser = await userRepo.save(
      userRepo.create({
        email: 'superadmin@codflow.io',
        name: 'Master Platform SuperAdmin',
        passwordHash,
        role: UserRoleEnum.SUPERADMIN,
        phoneNumber: '+10000000000',
        isActive: true,
      })
    );
    logger.info('Master SuperAdmin provisioned: superadmin@codflow.io / SuperAdminPass123!');
  }
}
