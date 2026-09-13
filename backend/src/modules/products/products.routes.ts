import { Router } from 'express';
import { z } from 'zod';
import { ProductsController } from './products.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireStoreAccess } from '../../middlewares/storeScope.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { UserRoleEnum } from '../../database/entities';

const router = Router();
const controller = new ProductsController();

const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().nonnegative(),
  barredPrice: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  shippingPrice: z.number().nonnegative().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  productStoreUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  isFragile: z.boolean().optional(),
  dimensions: z.string().optional(),
  weight: z.number().optional(),
  source: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// List & Read (Accessible by Seller, Admin, SuperAdmin, Manager, Agent)
router.get('/:storeId', authMiddleware, requireStoreAccess, controller.listProducts);
router.get('/:storeId/:productId', authMiddleware, requireStoreAccess, controller.getProduct);

// Create, Update, Delete (Manageable by Seller, Admin, SuperAdmin, Manager)
router.post(
  '/:storeId',
  authMiddleware,
  requireStoreAccess,
  requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER),
  validateRequest({ body: createProductSchema }),
  controller.createProduct
);

router.put(
  '/:storeId/:productId',
  authMiddleware,
  requireStoreAccess,
  requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER),
  validateRequest({ body: updateProductSchema }),
  controller.updateProduct
);

router.delete(
  '/:storeId/:productId',
  authMiddleware,
  requireStoreAccess,
  requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER),
  controller.deleteProduct
);

// CSV Import
router.post(
  '/:storeId/import-csv',
  authMiddleware,
  requireStoreAccess,
  requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER),
  controller.importCsv
);

// Sync from external channels
router.post(
  '/:storeId/sync-shops',
  authMiddleware,
  requireStoreAccess,
  requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER),
  controller.syncShops
);

router.post(
  '/:storeId/sync-sheets',
  authMiddleware,
  requireStoreAccess,
  requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER),
  controller.syncSheets
);

export default router;
