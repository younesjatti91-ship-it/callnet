import { Router } from 'express';
import { z } from 'zod';
import { WhatsAppController } from './whatsapp.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireStoreAccess } from '../../middlewares/storeScope.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { webhookRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();
const controller = new WhatsAppController();

const sendMessageSchema = z.object({
  to: z.string().min(6),
  message: z.string().min(1),
  orderId: z.string().optional(),
  sessionId: z.string().optional(),
});

const createSessionSchema = z.object({
  phoneNumber: z.string().optional(),
  label: z.string().optional(),
  engine: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const broadcastSchema = z.object({
  name: z.string().min(2),
  templateBody: z.string().min(2),
  recipientPhones: z.array(z.string().min(6)).min(1),
  throttleMs: z.number().int().positive().optional(),
});

// WAHA Health & Inbound Webhook
router.get('/health', controller.getHealth);
router.post('/webhook', webhookRateLimiter, controller.webhook);

// Multi-Session Management per Store (Managed by SuperAdmins, Admins, Sellers, Managers, and Agents)
router.get('/sessions/:storeId', authMiddleware, requireStoreAccess, controller.listSessions);
router.post('/sessions/:storeId', authMiddleware, requireStoreAccess, validateRequest({ body: createSessionSchema }), controller.createSession);
router.patch('/sessions/:storeId/:sessionId', authMiddleware, requireStoreAccess, controller.updateSession);
router.get('/sessions/:storeId/:sessionId/status', authMiddleware, requireStoreAccess, controller.getStatus);
router.get('/sessions/:storeId/:sessionId/qr', authMiddleware, requireStoreAccess, controller.getQRCode);
router.get('/sessions/:storeId/:sessionId/chats', authMiddleware, requireStoreAccess, controller.getChats);
router.get('/sessions/:storeId/:sessionId/contacts', authMiddleware, requireStoreAccess, controller.getContacts);
router.get('/sessions/:storeId/:sessionId/chats/:chatId/messages', authMiddleware, requireStoreAccess, controller.getMessages);
router.post('/sessions/:storeId/:sessionId/chats/:chatId/media', authMiddleware, requireStoreAccess, controller.sendMedia);
router.get('/sessions/:storeId/:sessionId/media', authMiddleware, requireStoreAccess, controller.getMediaProxy);
router.post('/sessions/:storeId/:sessionId/connect', authMiddleware, requireStoreAccess, controller.connect);
router.post('/sessions/:storeId/:sessionId/default', authMiddleware, requireStoreAccess, controller.setDefaultSession);
router.delete('/sessions/:storeId/:sessionId', authMiddleware, requireStoreAccess, controller.deleteSession);

// Stored Contacts in DB (for promotional campaigns & future launches)
router.get('/stored-contacts/:storeId', authMiddleware, requireStoreAccess, controller.getStoredContacts);
router.put('/stored-contacts/:storeId', authMiddleware, requireStoreAccess, controller.updateStoredContact);

// Backward-compatible single-session shortcuts
router.get('/status/:storeId', authMiddleware, requireStoreAccess, controller.getStatus);
router.post('/connect/:storeId', authMiddleware, requireStoreAccess, controller.connect);

// Message sending & Broadcast
router.post('/send/:storeId', authMiddleware, requireStoreAccess, validateRequest({ body: sendMessageSchema }), controller.send);
router.post('/broadcast/:storeId', authMiddleware, requireStoreAccess, validateRequest({ body: broadcastSchema }), controller.broadcast);
router.get('/broadcasts/:storeId', authMiddleware, requireStoreAccess, controller.listBroadcasts);
router.get('/logs/:storeId', authMiddleware, requireStoreAccess, controller.getLogs);

export default router;
