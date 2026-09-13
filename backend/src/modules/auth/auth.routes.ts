import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();
const controller = new AuthController();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), controller.login);
router.post('/register', authRateLimiter, validateRequest({ body: registerSchema }), controller.register);
router.get('/me', authMiddleware, controller.me);
router.put('/profile', authMiddleware, validateRequest({ body: updateProfileSchema }), controller.updateProfile);

export default router;
