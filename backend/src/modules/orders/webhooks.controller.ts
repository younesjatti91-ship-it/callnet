import { Request, Response, NextFunction } from 'express';
import { WebhooksService } from './webhooks.service';

const webhooksService = new WebhooksService();

export class WebhooksController {
  async shopify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await webhooksService.handleShopifyWebhook(storeId, req.body);
      res.status(200).json({ success: true, message: 'Shopify order ingested', orderId: order.id });
    } catch (err) {
      next(err);
    }
  }

  async woocommerce(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await webhooksService.handleWooCommerceWebhook(storeId, req.body);
      res.status(200).json({ success: true, message: 'WooCommerce order ingested', orderId: order.id });
    } catch (err) {
      next(err);
    }
  }

  async youcan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await webhooksService.handleYouCanWebhook(storeId, req.body);
      res.status(200).json({ success: true, message: 'YouCan order ingested', orderId: order.id });
    } catch (err) {
      next(err);
    }
  }

  async storeep(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await webhooksService.handleStoreepWebhook(storeId, req.body);
      res.status(200).json({ success: true, message: 'Storeep order ingested', orderId: order.id });
    } catch (err) {
      next(err);
    }
  }

  async lightfunnels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await webhooksService.handleLightfunnelsWebhook(storeId, req.body);
      res.status(200).json({ success: true, message: 'Lightfunnels order ingested', orderId: order.id });
    } catch (err) {
      next(err);
    }
  }

  async storeino(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await webhooksService.handleStoreinoWebhook(storeId, req.body);
      res.status(200).json({ success: true, message: 'Storeino order ingested', orderId: order.id });
    } catch (err) {
      next(err);
    }
  }

  async easyorders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await webhooksService.handleEasyOrdersWebhook(storeId, req.body);
      res.status(200).json({ success: true, message: 'EasyOrders order ingested', orderId: order.id });
    } catch (err) {
      next(err);
    }
  }

  async magento(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await webhooksService.handleMagentoWebhook(storeId, req.body);
      res.status(200).json({ success: true, message: 'Magento order ingested', orderId: order.id });
    } catch (err) {
      next(err);
    }
  }

  async customApi(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const order = await webhooksService.handleCustomApiOrder(storeId, req.body);
      res.status(200).json({ success: true, message: 'Custom API order ingested', orderId: order.id });
    } catch (err) {
      next(err);
    }
  }

  async mapGoogleSheetColumns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { headers, sampleRows } = req.body;
      if (!Array.isArray(headers) || headers.length === 0) {
        res.status(400).json({ success: false, message: 'headers array is required' });
        return;
      }
      const result = await webhooksService.mapGoogleSheetColumns(headers, sampleRows || []);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async syncGoogleSheets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.storeId;
      const { rows, headers, mapping } = req.body;
      if (!Array.isArray(rows) || !mapping) {
        res.status(400).json({ success: false, message: 'rows array and mapping object are required' });
        return;
      }
      const result = await webhooksService.syncGoogleSheetRows(storeId, rows, headers || [], mapping);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
