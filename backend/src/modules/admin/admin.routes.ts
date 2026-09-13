import { Router } from 'express';
import { z } from 'zod';
import { AdminController } from './admin.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { UserRoleEnum } from '../../database/entities';

const router = Router();
const controller = new AdminController();

// Both SuperAdmin and Admin can access admin routes
router.use(authMiddleware);
router.use(requireRoles(UserRoleEnum.SUPERADMIN, UserRoleEnum.ADMIN));

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.nativeEnum(UserRoleEnum),
  phoneNumber: z.string().optional(),
  storeId: z.string().uuid().optional(),
});

const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRoleEnum).optional(),
  phoneNumber: z.string().optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
});

router.get('/users', controller.listUsers);
router.post('/users', validateRequest({ body: createUserSchema }), controller.createUser);
router.put('/users/:userId', validateRequest({ body: updateUserSchema }), controller.updateUser);
router.patch('/users/:userId/status', validateRequest({ body: toggleStatusSchema }), controller.toggleUserStatus);

export default router;
