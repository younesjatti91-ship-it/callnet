import { AppDataSource } from '../../database/dataSource';
import { Order, OrderStatusEnum, CallLog, CallOutcomeEnum, AuditLog } from '../../database/entities';

export class AnalyticsService {
  private orderRepo = AppDataSource.getRepository(Order);
  private callLogRepo = AppDataSource.getRepository(CallLog);
  private auditRepo = AppDataSource.getRepository(AuditLog);

  async getStoreMetrics(storeId: string) {
    const orders = await this.orderRepo.find({ where: { storeId } });

    const totalOrders = orders.length;
    let pendingVerification = 0;
    let confirmed = 0;
    let shipped = 0;
    let delivered = 0;
    let returned = 0;
    let cancelled = 0;
    let totalCodPipeline = 0;
    let totalCashDelivered = 0;

    for (const o of orders) {
      const amount = Number(o.codAmount) || 0;
      totalCodPipeline += amount;

      switch (o.status) {
        case OrderStatusEnum.PENDING_VERIFICATION:
        case OrderStatusEnum.RESCHEDULED:
          pendingVerification += 1;
          break;
        case OrderStatusEnum.CONFIRMED:
        case OrderStatusEnum.FULFILLMENT:
          confirmed += 1;
          break;
        case OrderStatusEnum.SHIPPED:
          shipped += 1;
          break;
        case OrderStatusEnum.DELIVERED:
          delivered += 1;
          totalCashDelivered += amount;
          break;
        case OrderStatusEnum.RETURNED:
          returned += 1;
          break;
        case OrderStatusEnum.CANCELLED:
          cancelled += 1;
          break;
      }
    }

    const processedForVerification = totalOrders - pendingVerification;
    const confirmationRate = processedForVerification > 0
      ? ((confirmed + shipped + delivered + returned) / processedForVerification) * 100
      : 0;

    const completedShipments = delivered + returned;
    const deliverySuccessRate = completedShipments > 0
      ? (delivered / completedShipments) * 100
      : 0;

    const returnRate = completedShipments > 0
      ? (returned / completedShipments) * 100
      : 0;

    return {
      totalOrders,
      totalCodPipeline,
      totalCashDelivered,
      pendingVerification,
      confirmed,
      shipped,
      delivered,
      returned,
      cancelled,
      confirmationRate: Math.round(confirmationRate * 10) / 10,
      deliverySuccessRate: Math.round(deliverySuccessRate * 10) / 10,
      returnRate: Math.round(returnRate * 10) / 10,
    };
  }

  async getAgentPerformance(storeId: string) {
    const logs = await this.callLogRepo.find({ where: { storeId } });

    const agentMap = new Map<string, { agentName: string; totalCalls: number; confirmed: number; cancelled: number }>();

    for (const log of logs) {
      const existing = agentMap.get(log.agentUserId) || {
        agentName: log.agentName,
        totalCalls: 0,
        confirmed: 0,
        cancelled: 0,
      };

      existing.totalCalls += 1;
      if (log.outcome === CallOutcomeEnum.CONFIRMED) existing.confirmed += 1;
      if (log.outcome === CallOutcomeEnum.CANCELLED) existing.cancelled += 1;

      agentMap.set(log.agentUserId, existing);
    }

    return Array.from(agentMap.values()).map((a) => ({
      ...a,
      conversionRate: a.totalCalls > 0 ? Math.round((a.confirmed / a.totalCalls) * 100) : 0,
    }));
  }

  async getRecentAuditLogs(storeId?: string, limit: number = 20) {
    const where: any = {};
    if (storeId) where.storeId = storeId;

    return this.auditRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
