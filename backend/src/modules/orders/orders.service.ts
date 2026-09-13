import { AppDataSource } from '../../database/dataSource';
import {
  Order,
  OrderStatusEnum,
  OrderItem,
  OrderStatusHistory,
  Customer,
  Store,
  AuditLog,
} from '../../database/entities';

export interface CreateOrderDto {
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city?: string;
  province?: string;
  shippingAddress?: string;
  subtotal: number;
  shippingFee?: number;
  codAmount?: number;
  currency?: string;
  source?: string;
  notes?: string;
  items: Array<{
    productName: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export class OrdersService {
  private orderRepo = AppDataSource.getRepository(Order);
  private itemRepo = AppDataSource.getRepository(OrderItem);
  private historyRepo = AppDataSource.getRepository(OrderStatusHistory);
  private customerRepo = AppDataSource.getRepository(Customer);
  private storeRepo = AppDataSource.getRepository(Store);
  private auditRepo = AppDataSource.getRepository(AuditLog);

  async listOrders(storeId: string, options: {
    status?: OrderStatusEnum;
    search?: string;
    assignedAgentId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.storeId = :storeId', { storeId })
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (options.status) {
      qb.andWhere('order.status = :status', { status: options.status });
    }

    if (options.assignedAgentId) {
      qb.andWhere('order.assignedAgentId = :assignedAgentId', { assignedAgentId: options.assignedAgentId });
    }

    if (options.search) {
      qb.andWhere(
        '(order.orderNumber LIKE :s OR order.customerName LIKE :s OR order.customerPhone LIKE :s OR order.trackingNumber LIKE :s)',
        { s: `%${options.search}%` }
      );
    }

    const [orders, total] = await qb.getManyAndCount();
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrderById(storeId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, storeId },
      relations: ['items', 'statusHistory', 'shipments', 'shipments.snapshots'],
    });
    if (!order) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Order not found' };
    return order;
  }

  async createOrder(dto: CreateOrderDto, actorName: string = 'System Ingestion') {
    // 1. Find or create Customer
    let customer = await this.customerRepo.findOne({
      where: { storeId: dto.storeId, phone: dto.customerPhone },
    });

    if (!customer) {
      customer = await this.customerRepo.save(
        this.customerRepo.create({
          storeId: dto.storeId,
          fullName: dto.customerName,
          phone: dto.customerPhone,
          email: dto.customerEmail,
          city: dto.city,
          province: dto.province,
          address: dto.shippingAddress,
          totalOrders: 1,
        })
      );
    } else {
      customer.totalOrders += 1;
      await this.customerRepo.save(customer);
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const shippingFee = dto.shippingFee || 0;
    const codAmount = dto.codAmount !== undefined ? dto.codAmount : dto.subtotal + shippingFee;

    const order = this.orderRepo.create({
      storeId: dto.storeId,
      orderNumber,
      status: OrderStatusEnum.PENDING_VERIFICATION,
      customerId: customer.id,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      city: dto.city,
      province: dto.province,
      shippingAddress: dto.shippingAddress,
      subtotal: dto.subtotal,
      shippingFee,
      codAmount,
      currency: dto.currency || 'USD',
      source: dto.source || 'manual',
      statusCode: 'NEW',
      substatus: 'PENDING_REVIEW',
      contactIterations: 0,
      notes: dto.notes,
    });

    const savedOrder = await this.orderRepo.save(order);

    // Save order items
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        await this.itemRepo.save(
          this.itemRepo.create({
            orderId: savedOrder.id,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })
        );
      }
    }

    // Save status history
    await this.historyRepo.save(
      this.historyRepo.create({
        orderId: savedOrder.id,
        previousStatus: 'none',
        newStatus: OrderStatusEnum.PENDING_VERIFICATION,
        previousSubstatus: 'none',
        newSubstatus: 'PENDING_REVIEW',
        contactIterations: 0,
        changedByName: actorName,
        comment: 'Order registered',
        notes: `Order created via ${dto.source || 'manual'}`,
      })
    );

    // Audit log
    await this.auditRepo.save(
      this.auditRepo.create({
        storeId: dto.storeId,
        action: 'order.created',
        entityType: 'Order',
        entityId: savedOrder.id,
        details: { orderNumber: savedOrder.orderNumber, codAmount },
      })
    );

    return this.getOrderById(dto.storeId, savedOrder.id);
  }

  async updateOrderStatus(
    storeId: string,
    orderId: string,
    newStatus?: OrderStatusEnum | string,
    actor: { id?: string; name: string } = { name: 'Operator' },
    options: {
      notes?: string;
      cancellationReason?: string;
      trackingNumber?: string;
      courierName?: string;
      statusCode?: string;
      substatus?: string;
      contactIterations?: number;
      comment?: string;
      courierCompanyId?: string;
      courierAccountId?: string;
    } = {}
  ) {
    const order = await this.getOrderById(storeId, orderId);
    const previousStatus = order.status;
    const previousSubstatus = order.substatus || 'PENDING_REVIEW';

    // Handle contact iterations
    if (options.contactIterations !== undefined) {
      order.contactIterations = options.contactIterations;
    } else if (
      options.substatus &&
      ['CALL_BACK', 'NO_ANSWER', 'VOICEMAIL', 'UNREACHABLE'].some((prefix) =>
        options.substatus!.toUpperCase().startsWith(prefix)
      )
    ) {
      order.contactIterations = (order.contactIterations || 0) + 1;
    }

    // Determine status & statusCode & substatus
    if (options.statusCode) {
      order.statusCode = options.statusCode;
      if (options.substatus) {
        order.substatus = options.substatus;
      }
      // Map to legacy OrderStatusEnum for downstream systems
      switch (options.statusCode) {
        case 'NEW':
          order.status = OrderStatusEnum.PENDING_VERIFICATION;
          if (!options.substatus) order.substatus = 'PENDING_REVIEW';
          break;
        case 'CONFIRMATION':
          if (options.substatus === 'CONFIRMED') {
            order.status = OrderStatusEnum.CONFIRMED;
          } else {
            order.status = OrderStatusEnum.PENDING_VERIFICATION;
          }
          break;
        case 'FULFILLMENT':
          if (options.substatus === 'SHIPPED') {
            order.status = OrderStatusEnum.SHIPPED;
          } else {
            order.status = OrderStatusEnum.FULFILLMENT;
          }
          break;
        case 'DELIVERY':
          if (options.substatus === 'DELIVERED') {
            order.status = OrderStatusEnum.DELIVERED;
          } else if (options.substatus === 'REFUSED') {
            order.status = OrderStatusEnum.RETURNED;
          } else {
            order.status = OrderStatusEnum.SHIPPED;
          }
          break;
        case 'RETURN':
          order.status = OrderStatusEnum.RETURNED;
          break;
        case 'CANCELLED':
          order.status = OrderStatusEnum.CANCELLED;
          break;
      }
    } else if (newStatus) {
      order.status = newStatus as OrderStatusEnum;
      // Derive statusCode and substatus if not explicitly provided
      if (!options.substatus) {
        switch (newStatus) {
          case OrderStatusEnum.CONFIRMED:
            order.statusCode = 'CONFIRMATION';
            order.substatus = 'CONFIRMED';
            break;
          case OrderStatusEnum.FULFILLMENT:
            order.statusCode = 'FULFILLMENT';
            order.substatus = 'PREPARING';
            break;
          case OrderStatusEnum.SHIPPED:
            order.statusCode = 'FULFILLMENT';
            order.substatus = 'SHIPPED';
            break;
          case OrderStatusEnum.DELIVERED:
            order.statusCode = 'DELIVERY';
            order.substatus = 'DELIVERED';
            break;
          case OrderStatusEnum.RETURNED:
            order.statusCode = 'RETURN';
            order.substatus = 'RETURNED';
            break;
          case OrderStatusEnum.CANCELLED:
            order.statusCode = 'CANCELLED';
            order.substatus = 'CUSTOMER_CANCELLED';
            break;
          default:
            order.statusCode = 'NEW';
            order.substatus = 'PENDING_REVIEW';
            break;
        }
      } else {
        order.substatus = options.substatus;
      }
    }

    if (options.comment) order.lastComment = options.comment;
    if (options.notes) order.notes = options.notes;
    if (options.cancellationReason) order.cancellationReason = options.cancellationReason;
    if (options.trackingNumber) order.trackingNumber = options.trackingNumber;
    if (options.courierName) order.courierName = options.courierName;
    if (options.courierCompanyId) order.courierCompanyId = options.courierCompanyId;
    if (options.courierAccountId) order.courierAccountId = options.courierAccountId;

    // Agent assignment and commission calculation
    if (order.status === OrderStatusEnum.CONFIRMED && previousStatus !== OrderStatusEnum.CONFIRMED) {
      if (actor.id) {
        order.assignedAgentId = actor.id;
      }
      const store = await this.storeRepo.findOne({ where: { id: storeId } });
      const confirmCommission = Number(store?.settings?.agentCommissionPerConfirmedOrder ?? 5);
      order.agentCommissionAmount = Number(order.agentCommissionAmount || 0) + confirmCommission;
    }

    if (order.status === OrderStatusEnum.DELIVERED && previousStatus !== OrderStatusEnum.DELIVERED) {
      const store = await this.storeRepo.findOne({ where: { id: storeId } });
      const deliveredCommission = Number(store?.settings?.agentCommissionPerDeliveredOrder ?? 15);
      order.agentCommissionAmount = Number(order.agentCommissionAmount || 0) + deliveredCommission;
    }

    // Customer statistics update on terminal states
    if (order.customerId) {
      const customer = await this.customerRepo.findOne({ where: { id: order.customerId } });
      if (customer) {
        if (order.status === OrderStatusEnum.DELIVERED && previousStatus !== OrderStatusEnum.DELIVERED) {
          customer.deliveredOrders += 1;
        } else if (order.status === OrderStatusEnum.RETURNED && previousStatus !== OrderStatusEnum.RETURNED) {
          customer.returnedOrders += 1;
        }
        await this.customerRepo.save(customer);
      }
    }

    const savedOrder = await this.orderRepo.save(order);

    await this.historyRepo.save(
      this.historyRepo.create({
        orderId: savedOrder.id,
        previousStatus,
        newStatus: savedOrder.status,
        previousSubstatus,
        newSubstatus: savedOrder.substatus,
        contactIterations: savedOrder.contactIterations,
        comment: options.comment || options.notes,
        changedByUserId: actor.id,
        changedByName: actor.name,
        notes: options.notes || options.comment || `Status updated to ${savedOrder.statusCode}/${savedOrder.substatus}`,
      })
    );

    await this.auditRepo.save(
      this.auditRepo.create({
        storeId,
        userId: actor.id,
        action: 'order.status_changed',
        entityType: 'Order',
        entityId: savedOrder.id,
        details: {
          previousStatus,
          newStatus: savedOrder.status,
          statusCode: savedOrder.statusCode,
          substatus: savedOrder.substatus,
          contactIterations: savedOrder.contactIterations,
          comment: options.comment,
          reason: options.cancellationReason,
        },
      })
    );

    return savedOrder;
  }

  async importOrdersFromCSV(storeId: string, rows: any[], actorName: string = 'CSV Import') {
    const createdOrders: any[] = [];
    for (const row of rows) {
      if (!row.customerName || !row.customerPhone) continue;

      const subtotal = parseFloat(row.subtotal || row.price || '0');
      const shippingFee = parseFloat(row.shippingFee || '0');
      const codAmount = parseFloat(row.codAmount || `${subtotal + shippingFee}`);

      const order = await this.createOrder(
        {
          storeId,
          customerName: row.customerName,
          customerPhone: row.customerPhone,
          customerEmail: row.customerEmail,
          city: row.city,
          province: row.province,
          shippingAddress: row.shippingAddress || row.address,
          subtotal,
          shippingFee,
          codAmount,
          currency: row.currency || 'USD',
          source: 'csv_import',
          notes: row.notes,
          items: [
            {
              productName: row.productName || 'General Item',
              quantity: parseInt(row.quantity || '1', 10),
              unitPrice: subtotal,
              totalPrice: subtotal,
            },
          ],
        },
        actorName
      );
      createdOrders.push(order);
    }
    return { count: createdOrders.length, orders: createdOrders };
  }

  async updateOrderInstance(
    storeId: string,
    orderId: string,
    data: {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      city?: string;
      province?: string;
      shippingAddress?: string;
      subtotal?: number;
      shippingFee?: number;
      codAmount?: number;
      notes?: string;
      status?: OrderStatusEnum;
      statusCode?: string;
      substatus?: string;
      contactIterations?: number;
      comment?: string;
      courierCompanyId?: string;
      courierAccountId?: string;
    },
    actor: { id?: string; name: string }
  ) {
    const order = await this.getOrderById(storeId, orderId);

    if (
      (data.status && data.status !== order.status) ||
      (data.statusCode && data.statusCode !== order.statusCode) ||
      (data.substatus && data.substatus !== order.substatus)
    ) {
      await this.updateOrderStatus(storeId, orderId, data.status, actor, {
        notes: data.notes || `Status modified during instance edit by ${actor.name}`,
        statusCode: data.statusCode,
        substatus: data.substatus,
        contactIterations: data.contactIterations,
        comment: data.comment,
        courierCompanyId: data.courierCompanyId,
        courierAccountId: data.courierAccountId,
      });
    }

    if (data.customerName !== undefined) order.customerName = data.customerName;
    if (data.customerPhone !== undefined) order.customerPhone = data.customerPhone;
    if (data.customerEmail !== undefined) order.customerEmail = data.customerEmail;
    if (data.city !== undefined) order.city = data.city;
    if (data.province !== undefined) order.province = data.province;
    if (data.shippingAddress !== undefined) order.shippingAddress = data.shippingAddress;
    if (data.subtotal !== undefined) order.subtotal = data.subtotal;
    if (data.shippingFee !== undefined) order.shippingFee = data.shippingFee;
    if (data.codAmount !== undefined) order.codAmount = data.codAmount;
    if (data.notes !== undefined) order.notes = data.notes;
    if (data.comment !== undefined) order.lastComment = data.comment;
    if (data.contactIterations !== undefined) order.contactIterations = data.contactIterations;
    if (data.courierCompanyId !== undefined) order.courierCompanyId = data.courierCompanyId;
    if (data.courierAccountId !== undefined) order.courierAccountId = data.courierAccountId;

    const saved = await this.orderRepo.save(order);

    await this.auditRepo.save(
      this.auditRepo.create({
        storeId,
        action: 'order.updated',
        entityType: 'Order',
        entityId: order.id,
        details: { changes: data, updatedBy: actor.name },
      })
    );

    return this.getOrderById(storeId, saved.id);
  }
}
