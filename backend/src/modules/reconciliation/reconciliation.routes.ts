import { Router } from 'express';
import { z } from 'zod';
import { ReconciliationController } from './reconciliation.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireStoreAccess } from '../../middlewares/storeScope.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { DiscrepancyResolutionEnum, UserRoleEnum } from '../../database/entities';

const router = Router();
const controller = new ReconciliationController();

const resolveSchema = z.object({
  resolutionStatus: z.nativeEnum(DiscrepancyResolutionEnum),
  resolutionNotes: z.string().optional(),
});

router.post('/upload/:storeId', authMiddleware, requireStoreAccess, requireRoles(UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER), controller.uploadAndProcess);
router.get('/files/:storeId', authMiddleware, requireStoreAccess, controller.listFiles);
router.get('/files/:storeId/:fileId/records', authMiddleware, requireStoreAccess, controller.getFileRecords);
router.get('/discrepancies/:storeId', authMiddleware, requireStoreAccess, controller.listDiscrepancies);
router.patch('/discrepancies/:storeId/:discrepancyId/resolve', authMiddleware, requireStoreAccess, requireRoles(UserRoleEnum.ADMIN, UserRoleEnum.SELLER, UserRoleEnum.MANAGER), validateRequest({ body: resolveSchema }), controller.resolveDiscrepancy);

export default router;
