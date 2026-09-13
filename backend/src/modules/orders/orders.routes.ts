import { Router } from 'express';
import { z } from 'zod';
import { OrdersController } from './orders.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireStoreAccess } from '../../middlewares/storeScope.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { OrderStatusEnum } from '../../database/entities';

const router = Router({ mergeParams: true });
const controller = new OrdersController();

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  customerEmail: z.string().email().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  shippingAddress: z.string().optional(),
  subtotal: z.number().nonnegative(),
  shippingFee: z.number().nonnegative().optional(),
  codAmount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productName: z.string(),
      sku: z.string().optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
      totalPrice: z.number().nonnegative(),
    })
  ).optional().default([]),
});

const updateStatusSchema = z.object({
  status: z.string().optional(),
  statusCode: z.string().optional(),
  substatus: z.string().optional(),
  contactIterations: z.number().int().nonnegative().optional(),
  comment: z.string().optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
  trackingNumber: z.string().optional(),
  courierName: z.string().optional(),
  courierCompanyId: z.string().optional(),
  courierAccountId: z.string().optional(),
});

const updateOrderSchema = z.object({
  customerName: z.string().min(2).optional(),
  customerPhone: z.string().min(6).optional(),
  customerEmail: z.string().email().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  shippingAddress: z.string().optional(),
  subtotal: z.number().nonnegative().optional(),
  shippingFee: z.number().nonnegative().optional(),
  codAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  statusCode: z.string().optional(),
  substatus: z.string().optional(),
  contactIterations: z.number().int().nonnegative().optional(),
  comment: z.string().optional(),
  courierCompanyId: z.string().optional(),
  courierAccountId: z.string().optional(),
});

router.get('/:storeId', authMiddleware, requireStoreAccess, controller.listOrders);
router.get('/:storeId/:orderId', authMiddleware, requireStoreAccess, controller.getOrder);
router.post('/:storeId', authMiddleware, requireStoreAccess, validateRequest({ body: createOrderSchema }), controller.createOrder);
router.put('/:storeId/:orderId', authMiddleware, requireStoreAccess, validateRequest({ body: updateOrderSchema }), controller.updateOrder);
router.patch('/:storeId/:orderId/status', authMiddleware, requireStoreAccess, validateRequest({ body: updateStatusSchema }), controller.updateStatus);
router.put('/:storeId/:orderId/status', authMiddleware, requireStoreAccess, validateRequest({ body: updateStatusSchema }), controller.updateStatus);
router.post('/:storeId/import-csv', authMiddleware, requireStoreAccess, controller.importCSV);

export default router;
