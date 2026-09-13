import { Request, Response, NextFunction } from 'express';
import { WhatsAppService } from './whatsapp.service';

const waService = new WhatsAppService();

export class WhatsAppController {
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await waService.checkEngineHealth();
      res.json({ success: true, data: health });
    } catch (err) {
      next(err);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await waService.listSessions(req.params.storeId);
      res.json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  }

  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await waService.createSession(req.params.storeId, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async setDefaultSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await waService.setDefaultSession(req.params.storeId, req.params.sessionId);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await waService.deleteSession(req.params.storeId, req.params.sessionId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.sessionId;
      const conn = await waService.getSessionStatus(req.params.storeId, sessionId);
      res.json({ success: true, data: conn });
    } catch (err) {
      next(err);
    }
  }

  async connect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { engine } = req.body;
      const sessionId = req.params.sessionId;
      const conn = await waService.connectSession(req.params.storeId, sessionId, engine);
      res.json({ success: true, data: conn });
    } catch (err) {
      next(err);
    }
  }

  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { to, message, orderId, sessionId } = req.body;
      const log = await waService.sendMessage(req.params.storeId, { to, message, orderId, sessionId });
      res.json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  async broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const broadcast = await waService.createBroadcast(req.params.storeId, req.body);
      res.status(202).json({ success: true, data: broadcast });
    } catch (err) {
      next(err);
    }
  }

  async listBroadcasts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const broadcasts = await waService.listBroadcasts(req.params.storeId);
      res.json({ success: true, data: broadcasts });
    } catch (err) {
      next(err);
    }
  }

  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, broadcastId, limit } = req.query;
      const logs = await waService.getDeliveryLogs(req.params.storeId, {
        orderId: orderId as string,
        broadcastId: broadcastId as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  async updateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, sessionId } = req.params;
      const { label, isDefault } = req.body;
      const updated = await waService.updateSession(storeId, sessionId, { label, isDefault });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.sessionId;
      const data = await waService.getQRCode(req.params.storeId, sessionId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getChats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.sessionId;
      const chats = await waService.getSessionChats(req.params.storeId, sessionId);
      res.json({ success: true, data: chats });
    } catch (err) {
      next(err);
    }
  }

  async getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.sessionId;
      const contacts = await waService.getSessionContacts(req.params.storeId, sessionId);
      res.json({ success: true, data: contacts });
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, sessionId, chatId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const messages = await waService.getSessionMessages(storeId, sessionId, chatId, limit);
      res.json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  }

  async sendMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeId, sessionId, chatId } = req.params;
      const { file, caption } = req.body;
      const result = await waService.sendMedia(storeId, sessionId, chatId, file, caption);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMediaProxy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mediaUrl = req.query.url as string;
      if (!mediaUrl) {
        res.status(400).json({ success: false, message: 'Media URL required' });
        return;
      }
      const streamRes = await waService.getMediaStream(mediaUrl);
      if (!streamRes) {
        res.status(404).json({ success: false, message: 'Media not found' });
        return;
      }
      if (streamRes.headers['content-type']) {
        res.setHeader('Content-Type', String(streamRes.headers['content-type']));
      }
      if (streamRes.headers['content-length']) {
        res.setHeader('Content-Length', String(streamRes.headers['content-length']));
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      streamRes.data.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async getStoredContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contacts = await waService.getStoredContacts(req.params.storeId);
      res.json({ success: true, data: contacts });
    } catch (err) {
      next(err);
    }
  }

  async updateStoredContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await waService.updateStoredContact(req.params.storeId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await waService.handleWebhookEvent(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

