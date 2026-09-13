import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../database/dataSource';
import { UserRoleEnum, UserStoreAssignment, Store, Seller } from '../database/entities';

/**
 * Store-Level Authorization Middleware
 * Verifies that the authenticated user is explicitly authorized to access the requested store.
 */
export async function requireStoreAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  const storeId = req.params.storeId || req.body.storeId || (req.query.storeId as string);

  if (!storeId) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_STORE_ID', message: 'storeId is required for this operation' },
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  // Look up store by ID or slug
  const storeRepo = AppDataSource.getRepository(Store);
  const store = await storeRepo.findOne({
    where: [{ id: storeId }, { slug: storeId }],
    relations: ['seller'],
  });

  if (!store) {
    res.status(404).json({
      success: false,
      error: { code: 'STORE_NOT_FOUND', message: 'Store not found' },
    });
    return;
  }

  // Normalize storeId to canonical UUID for downstream queries
  if (req.params.storeId) req.params.storeId = store.id;

  // 1. Platform SuperAdmin, Admin & Moderator have universal operational access
  if (
    req.user.role === UserRoleEnum.SUPERADMIN ||
    req.user.role === UserRoleEnum.ADMIN ||
    req.user.role === UserRoleEnum.MODERATOR
  ) {
    next();
    return;
  }

  // 2. Check if user is the direct owner of the seller owning this store
  if (store.seller && store.seller.ownerUserId === req.user.id) {
    next();
    return;
  }

  // 3. Check explicit store assignment in user_store_assignments table
  const assignmentRepo = AppDataSource.getRepository(UserStoreAssignment);
  const assignment = await assignmentRepo.findOne({
    where: {
      userId: req.user.id,
      storeId: store.id,
    },
  });

  if (!assignment) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_STORE_ACCESS',
        message: 'You are not authorized to view or manage this store',
      },
    });
    return;
  }

  next();
}
