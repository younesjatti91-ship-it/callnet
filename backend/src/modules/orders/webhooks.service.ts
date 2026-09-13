import { OrdersService } from './orders.service';
import { AppDataSource } from '../../database/dataSource';
import { WebhookSubscription, AuditLog } from '../../database/entities';
import { logger } from '../../utils/logger';
import {
  ShopifyAdapter,
  YouCanAdapter,
  StoreepAdapter,
  WooCommerceAdapter,
  LightfunnelsAdapter,
  StoreinoAdapter,
  EasyOrdersAdapter,
  MagentoAdapter,
  CustomApiAdapter,
  GoogleSheetsAdapter,
  NormalizedOrderPayload,
} from './ecommerce.adapters';
import { GeminiService } from './gemini.service';

export class WebhooksService {
  private ordersService = new OrdersService();
  private webhookRepo = AppDataSource.getRepository(WebhookSubscription);
  private auditRepo = AppDataSource.getRepository(AuditLog);
  private geminiService = new GeminiService();

  private async saveNormalizedOrder(storeId: string, normalized: NormalizedOrderPayload, actor: string) {
    return this.ordersService.createOrder(
      {
        storeId,
        customerName: normalized.customerName,
        customerPhone: normalized.customerPhone,
        customerEmail: normalized.customerEmail,
        city: normalized.city,
        province: normalized.province,
        shippingAddress: normalized.shippingAddress,
        subtotal: normalized.subtotal,
        shippingFee: normalized.shippingFee,
        codAmount: normalized.codAmount,
        currency: normalized.currency,
        source: normalized.source,
        notes: normalized.notes,
        items: normalized.items,
      },
      actor
    );
  }

  // 1. Shopify
  async handleShopifyWebhook(storeId: string, payload: any) {
    logger.info(`Received Shopify webhook for store: ${storeId}`, { orderId: payload.id });
    const normalized = ShopifyAdapter.normalize(payload);
    return this.saveNormalizedOrder(storeId, normalized, 'Shopify Webhook');
  }

  // 2. YouCan
  async handleYouCanWebhook(storeId: string, payload: any) {
    logger.info(`Received YouCan webhook for store: ${storeId}`, { orderId: payload.id });
    const normalized = YouCanAdapter.normalize(payload);
    return this.saveNormalizedOrder(storeId, normalized, 'YouCan Webhook');
  }

  // 3. Storeep
  async handleStoreepWebhook(storeId: string, payload: any) {
    logger.info(`Received Storeep webhook for store: ${storeId}`);
    const normalized = StoreepAdapter.normalize(payload);
    return this.saveNormalizedOrder(storeId, normalized, 'Storeep Webhook');
  }

  // 4. WooCommerce
  async handleWooCommerceWebhook(storeId: string, payload: any) {
    logger.info(`Received WooCommerce webhook for store: ${storeId}`, { orderId: payload.id });
    const normalized = WooCommerceAdapter.normalize(payload);
    return this.saveNormalizedOrder(storeId, normalized, 'WooCommerce Webhook');
  }

  // 5. Lightfunnels
  async handleLightfunnelsWebhook(storeId: string, payload: any) {
    logger.info(`Received Lightfunnels webhook for store: ${storeId}`);
    const normalized = LightfunnelsAdapter.normalize(payload);
    return this.saveNormalizedOrder(storeId, normalized, 'Lightfunnels Webhook');
  }

  // 6. Storeino
  async handleStoreinoWebhook(storeId: string, payload: any) {
    logger.info(`Received Storeino webhook for store: ${storeId}`);
    const normalized = StoreinoAdapter.normalize(payload);
    return this.saveNormalizedOrder(storeId, normalized, 'Storeino Webhook');
  }

  // 7. EasyOrders
  async handleEasyOrdersWebhook(storeId: string, payload: any) {
    logger.info(`Received EasyOrders webhook for store: ${storeId}`);
    const normalized = EasyOrdersAdapter.normalize(payload);
    return this.saveNormalizedOrder(storeId, normalized, 'EasyOrders Webhook');
  }

  // 8. Magento
  async handleMagentoWebhook(storeId: string, payload: any) {
    logger.info(`Received Magento webhook for store: ${storeId}`);
    const normalized = MagentoAdapter.normalize(payload);
    return this.saveNormalizedOrder(storeId, normalized, 'Magento Webhook');
  }

  // 9. Simple / Custom API
  async handleCustomApiOrder(storeId: string, payload: any) {
    logger.info(`Received Custom API order ingestion for store: ${storeId}`);
    const normalized = CustomApiAdapter.normalize(payload);
    return this.saveNormalizedOrder(storeId, normalized, 'Custom API Integration');
  }

  // 10. Google Sheets AI column mapper (Analyzes at most 10 rows to minimize cost)
  async mapGoogleSheetColumns(headers: string[], sampleRows: any[] = []) {
    return this.geminiService.mapSheetColumns(headers, sampleRows);
  }

  // 10b. Google Sheets Row Sync
  async syncGoogleSheetRows(
    storeId: string,
    rows: any[],
    headers: string[],
    mapping: Record<string, string>
  ) {
    logger.info(`Syncing ${rows.length} rows from Google Sheet for store: ${storeId}`);
    const ingestedOrders: any[] = [];

    for (const row of rows) {
      try {
        const normalized = GoogleSheetsAdapter.normalizeRow(row, headers, mapping);
        if (!normalized.customerPhone && !normalized.customerName) {
          continue; // skip blank row
        }
        const order = await this.saveNormalizedOrder(storeId, normalized, 'Google Sheets Sync');
        ingestedOrders.push(order);
      } catch (err: any) {
        logger.error(`Failed to ingest row from Google Sheets: ${err.message}`, { row });
      }
    }

    return {
      syncedCount: ingestedOrders.length,
      orders: ingestedOrders,
    };
  }
}
