import { Router } from 'express';
import { z } from 'zod';
import { SellersController } from './sellers.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { requireStoreAccess } from '../../middlewares/storeScope.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { UserRoleEnum } from '../../database/entities';

const router = Router();
const controller = new SellersController();

// Admin / Moderator routes
router.get('/', authMiddleware, requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR), controller.listSellers);
router.get('/my/stores', authMiddleware, controller.getMyStores);
router.get('/:id', authMiddleware, controller.getSeller);

// Stores
router.get('/stores/all', authMiddleware, requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN), controller.getAllStores);

const createStoreSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

router.post('/stores', authMiddleware, requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER), validateRequest({ body: createStoreSchema }), controller.createStoreDirect);
router.post('/:sellerId/stores', authMiddleware, requireRoles(UserRoleEnum.ADMIN, UserRoleEnum.SELLER), validateRequest({ body: createStoreSchema }), controller.createStore);

router.get('/stores/:storeId', authMiddleware, requireStoreAccess, controller.getStore);
router.put('/stores/:storeId', authMiddleware, requireStoreAccess, requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER), controller.updateStore);
router.delete('/stores/:storeId', authMiddleware, requireStoreAccess, requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER), controller.deleteStore);
router.put('/stores/:storeId/settings', authMiddleware, requireStoreAccess, requireRoles(UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER), controller.updateStoreSettings);

// Store Agent / User assignments
router.get('/stores/:storeId/agents', authMiddleware, requireStoreAccess, controller.getAgents);

const assignUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['Manager', 'Agent', 'Moderator']).default('Agent'),
});

router.post('/stores/:storeId/assign', authMiddleware, requireStoreAccess, requireRoles(UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER), validateRequest({ body: assignUserSchema }), controller.assignUser);

router.delete('/stores/:storeId/assign/:userId', authMiddleware, requireStoreAccess, requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER), controller.removeUser);

// Store Agent Commission Configuration & Payout Reporting
const commissionSchema = z.object({
  agentCommissionPerConfirmedOrder: z.number().nonnegative().optional(),
  agentCommissionPerDeliveredOrder: z.number().nonnegative().optional(),
});

router.put(
  '/stores/:storeId/commissions',
  authMiddleware,
  requireStoreAccess,
  requireRoles(UserRoleEnum.SUPERADMIN),
  validateRequest({ body: commissionSchema }),
  controller.updateCommissions
);

router.get(
  '/stores/:storeId/agent-commissions',
  authMiddleware,
  requireStoreAccess,
  controller.getAgentCommissions
);

const agentChangeRequestSchema = z.object({
  storeId: z.string(),
  agentId: z.string(),
  reason: z.string().min(2),
  preferredCriteria: z.string().optional(),
  notes: z.string().optional(),
});

router.post(
  '/agent-change-request',
  authMiddleware,
  validateRequest({ body: agentChangeRequestSchema }),
  controller.requestAgentChange
);

// Store Integrations Management
const storeIntegrationSchema = z.object({
  providerCode: z.string().min(2),
  accountName: z.string().min(2),
  externalShopDomain: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  apiConfig: z.record(z.any()).optional(),
});

router.get(
  '/stores/:storeId/integrations',
  authMiddleware,
  requireStoreAccess,
  controller.listIntegrations
);

router.post(
  '/stores/:storeId/integrations',
  authMiddleware,
  requireStoreAccess,
  requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER),
  validateRequest({ body: storeIntegrationSchema }),
  controller.createIntegration
);

router.delete(
  '/stores/:storeId/integrations/:integrationId',
  authMiddleware,
  requireStoreAccess,
  requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER),
  controller.deleteIntegration
);

export default router;

