import { AppDataSource } from '../../database/dataSource';
import {
  CourierCompany,
  CourierAccount,
  Shipment,
  ShipmentStatusEnum,
  ShipmentTrackingSnapshot,
  ReturnRequest,
  Order,
  OrderStatusEnum,
  IntegrationCredential,
} from '../../database/entities';
import { encryptCredential, decryptCredential } from '../../utils/crypto';
import { OrdersService } from '../orders/orders.service';

import { CarrierApiClient } from './carrier.client';

export class CouriersService {
  private companyRepo = AppDataSource.getRepository(CourierCompany);
  private accountRepo = AppDataSource.getRepository(CourierAccount);
  private shipmentRepo = AppDataSource.getRepository(Shipment);
  private snapshotRepo = AppDataSource.getRepository(ShipmentTrackingSnapshot);
  private returnRepo = AppDataSource.getRepository(ReturnRequest);
  private orderRepo = AppDataSource.getRepository(Order);
  private credRepo = AppDataSource.getRepository(IntegrationCredential);
  private ordersService = new OrdersService();

  static readonly DEFAULT_CARRIERS = [
    { code: 'irsaliyat', name: 'IRSALIYAT Express', trackingUrlTemplate: 'https://irsaliyat.com/tracking/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'El Jadida', 'Mohammedia', 'Beni Mellal', 'Nador', 'ALL'] },
    { code: 'onessta', name: 'ONESSTA Logistics', trackingUrlTemplate: 'https://onessta.ma/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Meknes', 'Kenitra', 'Mohammedia', 'ALL'] },
    { code: 'forcelog', name: 'FORCELOG Delivery', trackingUrlTemplate: 'https://forcelog.ma/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Agadir', 'Fes', 'Kenitra', 'Mohammedia', 'ALL'] },
    { code: 'ameex', name: 'AMEEX Delivery', trackingUrlTemplate: 'https://ameex.ma/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'El Jadida', 'Mohammedia', 'Beni Mellal', 'Nador', 'ALL'] },
    { code: 'cathedis', name: 'CATHEDIS Express', trackingUrlTemplate: 'https://cathedis.ma/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'El Jadida', 'Mohammedia', 'Beni Mellal', 'Nador', 'Laayoune', 'Dakhla', 'ALL'] },
    { code: 'chrono_diali', name: 'CHRONO DIALI', trackingUrlTemplate: 'https://chronodiali.ma/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Meknes', 'Kenitra', 'Mohammedia', 'ALL'] },
    { code: 'sendit', name: 'SENDIT Express', trackingUrlTemplate: 'https://sendit.ma/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Meknes', 'Kenitra', 'Tetouan', 'Mohammedia', 'ALL'] },
    { code: 'ozon_express', name: 'OZON EXPRESS', trackingUrlTemplate: 'https://ozonexpress.ma/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Meknes', 'Kenitra', 'Tetouan', 'Mohammedia', 'ALL'] },
    { code: 'digylog', name: 'DIGYLOG Logistics', trackingUrlTemplate: 'https://digylog.ma/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Agadir', 'Kenitra', 'Mohammedia', 'ALL'] },
    { code: 'kargo_express', name: 'KARGO Express', trackingUrlTemplate: 'https://kargo.ma/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'El Jadida', 'Mohammedia', 'Beni Mellal', 'Nador', 'ALL'] },
    { code: 'jt_express', name: 'J&T Express', trackingUrlTemplate: 'https://www.jtexpress.com/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'El Jadida', 'Mohammedia', 'Beni Mellal', 'Nador', 'ALL'] },
    { code: 'dhl', name: 'DHL Express', trackingUrlTemplate: 'https://dhl.com/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Agadir', 'Fes', 'ALL'] },
    { code: 'ninjavan', name: 'Ninja Van', trackingUrlTemplate: 'https://ninjavan.co/track/{trackingNumber}', servicedCities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Agadir', 'Fes', 'ALL'] },
  ];

  async ensureCompaniesAndAccounts(storeId: string) {
    let companies = await this.companyRepo.find();
    if (companies.length === 0) {
      for (const def of CouriersService.DEFAULT_CARRIERS) {
        const comp = this.companyRepo.create({
          code: def.code,
          name: def.name,
          trackingUrlTemplate: def.trackingUrlTemplate,
          servicedCities: def.servicedCities,
          isActive: true,
        });
        await this.companyRepo.save(comp);
      }
      companies = await this.companyRepo.find();
    } else {
      // Ensure existing companies have servicedCities
      for (const comp of companies) {
        if (!comp.servicedCities || comp.servicedCities.length === 0) {
          const match = CouriersService.DEFAULT_CARRIERS.find((d) => d.code === comp.code);
          comp.servicedCities = match?.servicedCities || ['ALL', 'Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir'];
          await this.companyRepo.save(comp);
        }
      }
    }

    // Check if store has any accounts
    const existingAccounts = await this.accountRepo.find({ where: { storeId } });
    if (existingAccounts.length === 0 && companies.length > 0) {
      // Provision initial integrated accounts for the store
      const initialCodes = ['ameex', 'cathedis', 'sendit', 'onessta', 'irsaliyat', 'forcelog'];
      for (const comp of companies) {
        if (initialCodes.includes(comp.code) || initialCodes.length < 3) {
          await this.accountRepo.save(
            this.accountRepo.create({
              storeId,
              courierCompanyId: comp.id,
              accountName: `${comp.name} Account`,
              accountNumber: `ACC-${comp.code.toUpperCase().slice(0, 4)}-${storeId.slice(0, 4)}`,
              isActive: true,
              isDefault: comp.code === 'ameex',
            })
          );
        }
      }
    }
  }

  async listCompanies() {
    return this.companyRepo.find({ where: { isActive: true } });
  }

  async getAvailableCouriersForCity(storeId: string, city?: string) {
    await this.ensureCompaniesAndAccounts(storeId);

    const accounts = await this.accountRepo.find({
      where: { storeId, isActive: true },
      relations: ['courierCompany'],
    });

    if (!city || !city.trim() || city.trim().toLowerCase() === 'all') {
      return accounts;
    }

    const targetCity = city.trim().toLowerCase();

    // Filter accounts whose company covers this city
    return accounts.filter((acc) => {
      const company = acc.courierCompany;
      if (!company) return false;

      let cities: string[] = [];
      if (Array.isArray(company.servicedCities)) {
        cities = company.servicedCities;
      } else if (typeof company.servicedCities === 'string') {
        try {
          cities = JSON.parse(company.servicedCities);
        } catch {
          cities = (company.servicedCities as string).split(',').map((c) => c.trim());
        }
      }

      if (!cities || cities.length === 0) {
        cities = ['ALL'];
      }

      if (cities.some((c) => typeof c === 'string' && c.toUpperCase() === 'ALL')) {
        return true;
      }

      return cities.some((c) => {
        if (typeof c !== 'string') return false;
        const norm = c.trim().toLowerCase();
        return norm === targetCity || targetCity.includes(norm) || norm.includes(targetCity);
      });
    });
  }

  async testCourierConnection(
    storeId: string,
    data: {
      courierCode: string;
      apiKey?: string;
      apiSecret?: string;
      accountNumber?: string;
    }
  ) {
    return CarrierApiClient.testConnection(data.courierCode, data);
  }

  async getShipmentLabel(shipmentId: string) {
    const shipment = await this.shipmentRepo.findOne({
      where: [{ id: shipmentId }, { trackingNumber: shipmentId }],
      relations: ['order', 'order.store', 'courierAccount', 'courierAccount.courierCompany'],
    });
    if (!shipment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Shipment not found' };

    return CarrierApiClient.generateAirwayBillHtml({
      carrierName: shipment.courierAccount?.courierCompany?.name || 'COD EXPRESS',
      trackingNumber: shipment.trackingNumber,
      orderNumber: shipment.order?.orderNumber || 'ORD',
      recipientName: shipment.recipientName || 'Client',
      recipientPhone: shipment.recipientPhone || '',
      destinationAddress: shipment.destinationAddress || 'Morocco',
      destinationCity: shipment.order?.city || 'Casablanca',
      codAmount: Number(shipment.codAmountToCollect || 0),
      createdAt: shipment.createdAt,
      storeName: shipment.order?.store?.name || 'Seller Store',
    });
  }

  async listAccounts(storeId: string) {
    await this.ensureCompaniesAndAccounts(storeId);
    return this.accountRepo.find({
      where: { storeId },
      relations: ['courierCompany'],
    });
  }

  async createAccount(storeId: string, data: {
    courierCompanyId: string;
    accountName: string;
    accountNumber?: string;
    apiKey?: string;
    apiSecret?: string;
    isDefault?: boolean;
  }) {
    const account = this.accountRepo.create({
      storeId,
      courierCompanyId: data.courierCompanyId,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      isDefault: data.isDefault || false,
    });
    const savedAccount = await this.accountRepo.save(account);

    // Securely encrypt credentials with AES-256
    if (data.apiKey || data.apiSecret) {
      const encryptedPayload = encryptCredential(
        JSON.stringify({ apiKey: data.apiKey, apiSecret: data.apiSecret })
      );
      await this.credRepo.save(
        this.credRepo.create({
          entityType: 'courier_account',
          entityId: savedAccount.id,
          encryptedPayload,
        })
      );
    }

    return savedAccount;
  }

  async createShipment(
    storeId: string,
    data: {
      orderId: string;
      courierAccountId: string;
      shippingCost?: number;
    }
  ) {
    const order = await this.ordersService.getOrderById(storeId, data.orderId);
    const account = await this.accountRepo.findOne({
      where: { id: data.courierAccountId },
      relations: ['courierCompany'],
    });

    if (!account) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Courier account not found' };

    // Decrypt credentials if available
    let credentials: { apiKey?: string; apiSecret?: string } | undefined;
    const cred = await this.credRepo.findOne({
      where: { entityType: 'courier_account', entityId: account.id },
    });
    if (cred?.encryptedPayload) {
      try {
        credentials = JSON.parse(decryptCredential(cred.encryptedPayload));
      } catch {}
    }

    // Dispatch using carrier API client with carrier-specific payload
    const dispatchResult = await CarrierApiClient.dispatch(
      account.courierCompany.code,
      {
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        recipientAddress: order.shippingAddress || 'Morocco',
        recipientCity: order.city || 'Casablanca',
        codAmount: order.codAmount,
        orderNumber: order.orderNumber,
        productDescription: order.items?.map((i) => `${i.productName} x${i.quantity}`).join(', ') || 'COD Merchandise',
        quantity: order.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 1,
        allowOpen: true,
      },
      {
        apiKey: credentials?.apiKey,
        apiSecret: credentials?.apiSecret,
        accountNumber: account.accountNumber,
      }
    );

    const trackingNumber = dispatchResult.trackingNumber;

    const shipment = this.shipmentRepo.create({
      orderId: order.id,
      courierAccountId: account.id,
      trackingNumber,
      status: ShipmentStatusEnum.CREATED,
      codAmountToCollect: order.codAmount,
      shippingCost: data.shippingCost || 0,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone,
      destinationAddress: order.shippingAddress,
    });

    const savedShipment = await this.shipmentRepo.save(shipment);

    // Add initial tracking snapshot
    await this.snapshotRepo.save(
      this.snapshotRepo.create({
        shipmentId: savedShipment.id,
        normalizedStatus: 'created',
        rawStatus: dispatchResult.rawStatus || 'Shipment label created',
        description: `Shipment booked with ${account.courierCompany.name}`,
        eventTimestamp: new Date(),
      })
    );

    // Update order status to FULFILLMENT / SHIPPED
    await this.ordersService.updateOrderStatus(
      storeId,
      order.id,
      OrderStatusEnum.SHIPPED,
      { name: 'Logistics Dispatcher' },
      {
        trackingNumber,
        courierName: account.courierCompany.name,
        courierCompanyId: account.courierCompanyId,
        courierAccountId: account.id,
        statusCode: 'FULFILLMENT',
        substatus: 'SHIPPED',
        comment: `Dispatched with ${account.courierCompany.name}. Waybill/Tracking: ${trackingNumber}`,
        notes: `Dispatched with ${account.courierCompany.name}. Tracking: ${trackingNumber}`,
      }
    );

    return savedShipment;
  }

  async dispatchOrder(
    storeId: string,
    orderId: string,
    data: {
      courierAccountId?: string;
      courierCompanyId?: string;
      shippingCost?: number;
    }
  ) {
    await this.ensureCompaniesAndAccounts(storeId);

    let accountId = data.courierAccountId;

    if (!accountId && data.courierCompanyId) {
      let acc = await this.accountRepo.findOne({
        where: { storeId, courierCompanyId: data.courierCompanyId, isActive: true },
      });
      if (!acc) {
        const comp = await this.companyRepo.findOne({ where: { id: data.courierCompanyId } });
        if (comp) {
          acc = await this.accountRepo.save(
            this.accountRepo.create({
              storeId,
              courierCompanyId: comp.id,
              accountName: `${comp.name} Main`,
              accountNumber: `ACC-${comp.code.toUpperCase().slice(0, 4)}-${storeId.slice(0, 4)}`,
              isActive: true,
            })
          );
        }
      }
      if (acc) {
        accountId = acc.id;
      }
    }

    if (!accountId) {
      const defaultAcc = await this.accountRepo.findOne({
        where: { storeId, isActive: true },
        relations: ['courierCompany'],
        order: { isDefault: 'DESC', createdAt: 'ASC' },
      });
      if (defaultAcc) {
        accountId = defaultAcc.id;
      }
    }

    if (!accountId) {
      throw { statusCode: 400, code: 'NO_COURIER_ACCOUNT', message: 'No active courier account found for this store' };
    }

    const shipment = await this.createShipment(storeId, {
      orderId,
      courierAccountId: accountId,
      shippingCost: data.shippingCost || 0,
    });

    const updatedOrder = await this.ordersService.getOrderById(storeId, orderId);

    return {
      success: true,
      trackingNumber: shipment.trackingNumber,
      courierName: updatedOrder.courierName,
      shipmentId: shipment.id,
      shipment,
      order: updatedOrder,
    };
  }

  async lookupTracking(query?: string, storeId?: string) {
    const qb = this.shipmentRepo.createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.order', 'order')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('shipment.courierAccount', 'courierAccount')
      .leftJoinAndSelect('courierAccount.courierCompany', 'courierCompany')
      .leftJoinAndSelect('shipment.snapshots', 'snapshots')
      .orderBy('shipment.createdAt', 'DESC');

    if (storeId) {
      qb.andWhere('order.storeId = :storeId', { storeId });
    }

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      qb.andWhere(
        '(shipment.trackingNumber LIKE :q OR order.orderNumber LIKE :q OR order.customerPhone LIKE :q OR order.customerName LIKE :q OR order.city LIKE :q)',
        { q }
      );
    }

    const shipments = await qb.take(50).getMany();
    return shipments;
  }

  async addTrackingSnapshot(
    shipmentId: string,
    snapshotData: {
      normalizedStatus: string;
      rawStatus?: string;
      location?: string;
      description?: string;
    }
  ) {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
      relations: ['order'],
    });
    if (!shipment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Shipment not found' };

    const snapshot = await this.snapshotRepo.save(
      this.snapshotRepo.create({
        shipmentId,
        normalizedStatus: snapshotData.normalizedStatus,
        rawStatus: snapshotData.rawStatus || snapshotData.normalizedStatus,
        location: snapshotData.location,
        description: snapshotData.description,
        eventTimestamp: new Date(),
      })
    );

    // Update shipment and order status accordingly
    const normalized = snapshotData.normalizedStatus.toLowerCase();
    if (normalized.includes('delivered')) {
      shipment.status = ShipmentStatusEnum.DELIVERED;
      shipment.deliveredAt = new Date();
      await this.ordersService.updateOrderStatus(
        shipment.order.storeId,
        shipment.orderId,
        OrderStatusEnum.DELIVERED,
        { name: 'Courier Tracking Sync' },
        {
          statusCode: 'DELIVERY',
          substatus: 'DELIVERED',
          comment: `Carrier confirmed delivery at ${snapshotData.location || 'Destination'}`,
          notes: `Confirmed delivery at ${snapshotData.location || 'Destination'}`,
        }
      );
    } else if (normalized.includes('return')) {
      shipment.status = ShipmentStatusEnum.RETURNED;
      await this.ordersService.updateOrderStatus(
        shipment.order.storeId,
        shipment.orderId,
        OrderStatusEnum.RETURNED,
        { name: 'Courier Tracking Sync' },
        {
          statusCode: 'RETURN',
          substatus: 'RETURN_IN_PROGRESS',
          comment: `Package return in progress: ${snapshotData.description || 'Delivery failed'}`,
          notes: `Package returned by carrier: ${snapshotData.description || 'Failed delivery'}`,
        }
      );
    } else if (normalized.includes('out_for_delivery')) {
      shipment.status = ShipmentStatusEnum.OUT_FOR_DELIVERY;
      await this.ordersService.updateOrderStatus(
        shipment.order.storeId,
        shipment.orderId,
        OrderStatusEnum.SHIPPED,
        { name: 'Courier Tracking Sync' },
        {
          statusCode: 'DELIVERY',
          substatus: 'OUT_FOR_DELIVERY',
          comment: `Out for delivery with courier driver in ${snapshotData.location || 'Area'}`,
        }
      );
    } else if (normalized.includes('in_transit')) {
      shipment.status = ShipmentStatusEnum.IN_TRANSIT;
      await this.ordersService.updateOrderStatus(
        shipment.order.storeId,
        shipment.orderId,
        OrderStatusEnum.SHIPPED,
        { name: 'Courier Tracking Sync' },
        {
          statusCode: 'DELIVERY',
          substatus: 'IN_TRANSIT',
          comment: `In transit at ${snapshotData.location || 'Hub'}`,
        }
      );
    }

    await this.shipmentRepo.save(shipment);
    return snapshot;
  }

  async handleCourierWebhook(courierCode: string, payload: any) {
    const { CourierWebhookParser } = await import('./shipping.adapters');
    const parsed = CourierWebhookParser.parse(courierCode, payload);

    if (!parsed.trackingNumber) {
      return { received: true, matched: false, reason: 'No tracking number found in webhook payload' };
    }

    const shipment = await this.shipmentRepo.findOne({
      where: { trackingNumber: parsed.trackingNumber },
      relations: ['order'],
    });

    if (!shipment) {
      return { received: true, matched: false, reason: `Shipment ${parsed.trackingNumber} not found` };
    }

    const snapshot = await this.addTrackingSnapshot(shipment.id, {
      normalizedStatus: parsed.canonicalStatus,
      rawStatus: parsed.rawStatus,
      location: parsed.location,
      description: parsed.notes || `Webhook update from ${courierCode.toUpperCase()}`,
    });

    return {
      received: true,
      matched: true,
      shipmentId: shipment.id,
      trackingNumber: parsed.trackingNumber,
      canonicalStatus: parsed.canonicalStatus,
      snapshotId: snapshot.id,
    };
  }

  async getShipments(storeId: string) {
    return this.shipmentRepo.createQueryBuilder('shipment')
      .innerJoin('shipment.order', 'order', 'order.storeId = :storeId', { storeId })
      .leftJoinAndSelect('shipment.courierAccount', 'courierAccount')
      .leftJoinAndSelect('courierAccount.courierCompany', 'courierCompany')
      .leftJoinAndSelect('shipment.snapshots', 'snapshots')
      .orderBy('shipment.createdAt', 'DESC')
      .getMany();
  }

  async createReturn(
    storeId: string,
    orderId: string,
    data: { reason: string; notes?: string; returnTrackingNumber?: string }
  ) {
    const order = await this.ordersService.getOrderById(storeId, orderId);

    const returnRequest = this.returnRepo.create({
      orderId: order.id,
      reason: data.reason,
      notes: data.notes,
      returnTrackingNumber: data.returnTrackingNumber,
      status: 'initiated',
    });

    const savedReturn = await this.returnRepo.save(returnRequest);

    await this.ordersService.updateOrderStatus(
      storeId,
      order.id,
      OrderStatusEnum.RETURNED,
      { name: 'Returns Specialist' },
      { notes: `Reverse logistics initiated: ${data.reason}`, cancellationReason: data.reason }
    );

    return savedReturn;
  }
}
