import { Router } from 'express';
import { z } from 'zod';
import { CouriersController } from './couriers.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireStoreAccess } from '../../middlewares/storeScope.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { UserRoleEnum } from '../../database/entities';

const router = Router();
const controller = new CouriersController();

const createAccountSchema = z.object({
  courierCompanyId: z.string().uuid(),
  accountName: z.string().min(2),
  accountNumber: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const createShipmentSchema = z.object({
  orderId: z.string().uuid(),
  courierAccountId: z.string().uuid(),
  shippingCost: z.number().nonnegative().optional(),
});

const snapshotSchema = z.object({
  normalizedStatus: z.string().min(2),
  rawStatus: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

const returnSchema = z.object({
  reason: z.string().min(2),
  notes: z.string().optional(),
  returnTrackingNumber: z.string().optional(),
});

// Courier Companies catalogue
router.get('/companies', authMiddleware, controller.listCompanies);

// Accounts
router.get('/accounts/:storeId', authMiddleware, requireStoreAccess, controller.listAccounts);
router.post('/accounts/:storeId', authMiddleware, requireStoreAccess, requireRoles(UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER), validateRequest({ body: createAccountSchema }), controller.createAccount);
router.post('/accounts/:storeId/test-connection', authMiddleware, requireStoreAccess, controller.testConnection);

// City-aware integrated couriers
router.get('/available-for-city/:storeId', authMiddleware, requireStoreAccess, controller.getAvailableForCity);

// Direct order dispatch with courier API
router.post('/dispatch/:storeId/:orderId', authMiddleware, requireStoreAccess, controller.dispatchOrder);

// Shipments & Tracking
router.get('/tracking-lookup', authMiddleware, controller.lookupTracking);
router.get('/shipments/:storeId', authMiddleware, requireStoreAccess, controller.listShipments);
router.post('/shipments/:storeId', authMiddleware, requireStoreAccess, validateRequest({ body: createShipmentSchema }), controller.createShipment);
router.get('/shipments/:shipmentId/label', controller.getLabel);
router.post('/snapshots/:shipmentId', authMiddleware, validateRequest({ body: snapshotSchema }), controller.addSnapshot);

// Reverse Logistics / Returns
router.post('/returns/:storeId/:orderId', authMiddleware, requireStoreAccess, validateRequest({ body: returnSchema }), controller.createReturn);

// Courier Inbound Webhooks
router.post('/webhook/:courierCode', controller.handleWebhook);

export default router;
