import { AppDataSource } from '../../database/dataSource';
import {
  Order,
  OrderStatusEnum,
  CallLog,
  CallOutcomeEnum,
  Store,
  User,
  AuditLog,
} from '../../database/entities';
import { OrdersService } from '../orders/orders.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { logger } from '../../utils/logger';

export class CallCenterService {
  private orderRepo = AppDataSource.getRepository(Order);
  private callLogRepo = AppDataSource.getRepository(CallLog);
  private storeRepo = AppDataSource.getRepository(Store);
  private userRepo = AppDataSource.getRepository(User);
  private ordersService = new OrdersService();
  private whatsAppService = new WhatsAppService();

  async getQueue(storeId: string, options: { agentId?: string; unassignedOnly?: boolean } = {}) {
    const qb = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatusEnum.PENDING_VERIFICATION, OrderStatusEnum.RESCHEDULED],
      })
      .orderBy('order.callAttemptsCount', 'ASC')
      .addOrderBy('order.createdAt', 'ASC');

    if (options.agentId) {
      qb.andWhere('(order.assignedAgentId = :agentId OR order.assignedAgentId IS NULL)', {
        agentId: options.agentId,
      });
    }

    if (options.unassignedOnly) {
      qb.andWhere('order.assignedAgentId IS NULL');
    }

    return qb.getMany();
  }

  async recordCallAttempt(
    storeId: string,
    data: {
      orderId: string;
      agentUserId: string;
      agentName: string;
      outcome: CallOutcomeEnum;
      durationSeconds?: number;
      notes?: string;
      callbackScheduledAt?: string;
      cancellationReason?: string;
    }
  ) {
    const order = await this.ordersService.getOrderById(storeId, data.orderId);
    const store = await this.storeRepo.findOne({ where: { id: storeId } });

    // 1. Create CallLog entry
    const callLog = this.callLogRepo.create({
      storeId,
      orderId: order.id,
      agentUserId: data.agentUserId,
      agentName: data.agentName,
      customerPhone: order.customerPhone,
      outcome: data.outcome,
      durationSeconds: data.durationSeconds || 0,
      notes: data.notes,
      callbackScheduledAt: data.callbackScheduledAt ? new Date(data.callbackScheduledAt) : undefined,
    });

    // 2. Update Order call attempt metrics
    order.callAttemptsCount = (order.callAttemptsCount || 0) + 1;
    order.lastCallAttemptAt = new Date();

    // 3. Handle Status Transitions based on Call Outcome
    if (data.outcome === CallOutcomeEnum.CONFIRMED) {
      await this.ordersService.updateOrderStatus(
        storeId,
        order.id,
        OrderStatusEnum.CONFIRMED,
        { id: data.agentUserId, name: data.agentName },
        { notes: data.notes || 'Order confirmed via phone call' }
      );
    } else if (data.outcome === CallOutcomeEnum.CANCELLED) {
      await this.ordersService.updateOrderStatus(
        storeId,
        order.id,
        OrderStatusEnum.CANCELLED,
        { id: data.agentUserId, name: data.agentName },
        {
          notes: data.notes || 'Order cancelled by customer during call',
          cancellationReason: data.cancellationReason || 'customer_refused',
        }
      );
    } else if (data.outcome === CallOutcomeEnum.RESCHEDULED && data.callbackScheduledAt) {
      order.scheduledCallbackAt = new Date(data.callbackScheduledAt);
      await this.ordersService.updateOrderStatus(
        storeId,
        order.id,
        OrderStatusEnum.RESCHEDULED,
        { id: data.agentUserId, name: data.agentName },
        { notes: `Callback rescheduled for ${data.callbackScheduledAt}` }
      );
    }

    // 4. Trigger automated WhatsApp follow-up if lead was unreachable
    const isUnreachable = [
      CallOutcomeEnum.NO_ANSWER,
      CallOutcomeEnum.BUSY,
      CallOutcomeEnum.UNREACHABLE,
    ].includes(data.outcome);

    if (isUnreachable && store?.settings?.autoTriggerWhatsAppOnNoAnswer !== false) {
      try {
        const messageBody = `Hello ${order.customerName}, we tried calling you to confirm your order #${order.orderNumber} for ${order.currency} ${order.codAmount}. Please reply YES to confirm your order or let us know when we can reach you. Thank you!`;
        
        await this.whatsAppService.sendMessage(storeId, {
          to: order.customerPhone,
          message: messageBody,
          orderId: order.id,
        });

        callLog.whatsappTriggered = true;
        logger.info(`Automated WhatsApp follow-up triggered for order: ${order.orderNumber}`);
      } catch (waErr: any) {
        logger.warn(`Could not trigger automated WhatsApp follow-up: ${waErr.message}`);
      }
    }

    await this.orderRepo.save(order);
    const savedLog = await this.callLogRepo.save(callLog);

    return {
      callLog: savedLog,
      orderStatus: order.status,
      callAttemptsCount: order.callAttemptsCount,
      whatsappTriggered: callLog.whatsappTriggered,
    };
  }

  async assignOrders(storeId: string, orderIds: string[], agentUserId: string) {
    const agent = await this.userRepo.findOne({ where: { id: agentUserId } });
    if (!agent) throw { statusCode: 404, code: 'AGENT_NOT_FOUND', message: 'Agent not found' };

    await this.orderRepo.createQueryBuilder()
      .update(Order)
      .set({ assignedAgentId: agentUserId })
      .where('storeId = :storeId', { storeId })
      .andWhere('id IN (:...orderIds)', { orderIds })
      .execute();

    return { success: true, count: orderIds.length, agentName: agent.name };
  }

  async getCallLogs(storeId: string, orderId: string) {
    return this.callLogRepo.find({
      where: { storeId, orderId },
      order: { calledAt: 'DESC' },
    });
  }
}
