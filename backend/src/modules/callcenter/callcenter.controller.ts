import { Request, Response, NextFunction } from 'express';
import { CallCenterService } from './callcenter.service';

const callCenterService = new CallCenterService();

export class CallCenterController {
  async getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const { agentId, unassignedOnly } = req.query;
      const queue = await callCenterService.getQueue(storeId, {
        agentId: agentId as string,
        unassignedOnly: unassignedOnly === 'true',
      });
      res.json({ success: true, data: queue });
    } catch (err) {
      next(err);
    }
  }

  async recordCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const result = await callCenterService.recordCallAttempt(storeId, {
        ...req.body,
        agentUserId: req.user!.id,
        agentName: req.user!.name,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async assignOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const { orderIds, agentUserId } = req.body;
      const result = await callCenterService.assignOrders(storeId, orderIds, agentUserId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getCallLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, orderId } = req.params;
      const logs = await callCenterService.getCallLogs(storeId, orderId);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}
