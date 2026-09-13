import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireStoreAccess } from '../../middlewares/storeScope.middleware';

const router = Router();
const controller = new AnalyticsController();

router.get('/metrics/:storeId', authMiddleware, requireStoreAccess, controller.getMetrics);
router.get('/agents/:storeId', authMiddleware, requireStoreAccess, controller.getAgentStats);
router.get('/audit', authMiddleware, controller.getAuditLogs);

export default router;
