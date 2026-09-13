import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const metrics = await analyticsService.getStoreMetrics(storeId);
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  async getAgentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const stats = await analyticsService.getAgentPerformance(storeId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId } = req.query;
      const logs = await analyticsService.getRecentAuditLogs(storeId as string);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}
