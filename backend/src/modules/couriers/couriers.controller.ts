import { Request, Response, NextFunction } from 'express';
import { CouriersService } from './couriers.service';

const couriersService = new CouriersService();

export class CouriersController {
  async listCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companies = await couriersService.listCompanies();
      res.json({ success: true, data: companies });
    } catch (err) {
      next(err);
    }
  }

  async listAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accounts = await couriersService.listAccounts(req.params.storeId);
      res.json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = await couriersService.createAccount(req.params.storeId, req.body);
      res.status(201).json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  async createShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shipment = await couriersService.createShipment(req.params.storeId, req.body);
      res.status(201).json({ success: true, data: shipment });
    } catch (err) {
      next(err);
    }
  }

  async addSnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const snapshot = await couriersService.addTrackingSnapshot(req.params.shipmentId, req.body);
      res.json({ success: true, data: snapshot });
    } catch (err) {
      next(err);
    }
  }

  async listShipments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shipments = await couriersService.getShipments(req.params.storeId);
      res.json({ success: true, data: shipments });
    } catch (err) {
      next(err);
    }
  }

  async createReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const returnReq = await couriersService.createReturn(
        req.params.storeId,
        req.params.orderId,
        req.body
      );
      res.status(201).json({ success: true, data: returnReq });
    } catch (err) {
      next(err);
    }
  }

  async testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await couriersService.testCourierConnection(req.params.storeId, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getLabel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const html = await couriersService.getShipmentLabel(req.params.shipmentId);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      next(err);
    }
  }

  async getAvailableForCity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId } = req.params;
      const city = (req.query.city as string) || undefined;
      const accounts = await couriersService.getAvailableCouriersForCity(storeId, city);
      res.json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  async dispatchOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, orderId } = req.params;
      const result = await couriersService.dispatchOrder(storeId, orderId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async lookupTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      const storeId = (req.query.storeId as string) || undefined;
      const shipments = await couriersService.lookupTracking(query, storeId);
      res.json({ success: true, data: shipments });
    } catch (err) {
      next(err);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courierCode = req.params.courierCode;
      const result = await couriersService.handleCourierWebhook(courierCode, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

