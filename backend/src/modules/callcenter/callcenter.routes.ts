import { Router } from 'express';
import { z } from 'zod';
import { CallCenterController } from './callcenter.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireStoreAccess } from '../../middlewares/storeScope.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { CallOutcomeEnum, UserRoleEnum } from '../../database/entities';

const router = Router();
const controller = new CallCenterController();

const recordCallSchema = z.object({
  orderId: z.string().uuid(),
  outcome: z.nativeEnum(CallOutcomeEnum),
  durationSeconds: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  callbackScheduledAt: z.string().optional(),
  cancellationReason: z.string().optional(),
});

const assignOrdersSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1),
  agentUserId: z.string().uuid(),
});

router.get('/queue/:storeId', authMiddleware, requireStoreAccess, controller.getQueue);
router.post('/calls/:storeId', authMiddleware, requireStoreAccess, validateRequest({ body: recordCallSchema }), controller.recordCall);
router.post('/assign/:storeId', authMiddleware, requireStoreAccess, requireRoles(UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER), validateRequest({ body: assignOrdersSchema }), controller.assignOrders);
router.get('/logs/:storeId/:orderId', authMiddleware, requireStoreAccess, controller.getCallLogs);

export default router;
