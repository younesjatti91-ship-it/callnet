import { Request, Response, NextFunction } from 'express';
import { OrdersService } from './orders.service';
import { OrderStatusEnum } from '../../database/entities';

const ordersService = new OrdersService();

export class OrdersController {
  async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const { status, search, assignedAgentId, page, limit } = req.query;

      const result = await ordersService.listOrders(storeId, {
        status: status as OrderStatusEnum,
        search: search as string,
        assignedAgentId: assignedAgentId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, orderId } = req.params;
      const order = await ordersService.getOrderById(storeId, orderId);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await ordersService.createOrder(
        { ...req.body, storeId },
        req.user?.name || 'API User'
      );
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, orderId } = req.params;
      const {
        status,
        notes,
        cancellationReason,
        trackingNumber,
        courierName,
        statusCode,
        substatus,
        contactIterations,
        comment,
        courierCompanyId,
        courierAccountId,
      } = req.body;

      const updated = await ordersService.updateOrderStatus(
        storeId,
        orderId,
        status,
        { id: req.user?.id, name: req.user?.name || 'Operator' },
        {
          notes,
          cancellationReason,
          trackingNumber,
          courierName,
          statusCode,
          substatus,
          contactIterations,
          comment,
          courierCompanyId,
          courierAccountId,
        }
      );

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, orderId } = req.params;
      const updated = await ordersService.updateOrderInstance(
        storeId,
        orderId,
        req.body,
        { id: req.user?.id, name: req.user?.name || 'Operator' }
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async importCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const rows = req.body.rows || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        res.status(400).json({ success: false, error: { message: 'rows array is required' } });
        return;
      }

      const result = await ordersService.importOrdersFromCSV(
        storeId,
        rows,
        `CSV Import by ${req.user?.name || 'User'}`
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
