import { Router } from 'express';
import { WebhooksController } from './webhooks.controller';
import { webhookRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();
const controller = new WebhooksController();

// 1. Shopify Webhook
router.post('/shopify/:storeId', webhookRateLimiter, controller.shopify);

// 2. WooCommerce Webhook
router.post('/woocommerce/:storeId', webhookRateLimiter, controller.woocommerce);

// 3. YouCan Webhook
router.post('/youcan/:storeId', webhookRateLimiter, controller.youcan);

// 4. Storeep Webhook
router.post('/storeep/:storeId', webhookRateLimiter, controller.storeep);

// 5. Lightfunnels Webhook
router.post('/lightfunnels/:storeId', webhookRateLimiter, controller.lightfunnels);

// 6. Storeino Webhook
router.post('/storeino/:storeId', webhookRateLimiter, controller.storeino);

// 7. EasyOrders Webhook
router.post('/easyorders/:storeId', webhookRateLimiter, controller.easyorders);

// 8. Magento Webhook
router.post('/magento/:storeId', webhookRateLimiter, controller.magento);

// 9. Simple / Custom API
router.post('/api/:storeId', webhookRateLimiter, controller.customApi);

// 10. Google Sheets AI Column Mapper & Row Sync
router.post('/google-sheets/map-columns', webhookRateLimiter, controller.mapGoogleSheetColumns);
router.post('/google-sheets/:storeId/sync', webhookRateLimiter, controller.syncGoogleSheets);

export default router;
