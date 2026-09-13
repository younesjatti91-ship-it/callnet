import { Router } from 'express';
import { z } from 'zod';
import { MessagesController } from './messages.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';

const router = Router();
const controller = new MessagesController();

const sendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

// All message endpoints require authentication
router.use(authMiddleware);

router.get('/contacts', controller.listContacts);
router.get('/unread-count', controller.getUnreadCount);
router.get('/conversation/:userId', controller.getConversation);
router.post('/send', validateRequest({ body: sendMessageSchema }), controller.sendMessage);

export default router;
