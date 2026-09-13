import { Request, Response, NextFunction } from 'express';
import { MessagesService } from './messages.service';

const messagesService = new MessagesService();

export class MessagesController {
  async listContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = req.user!.id;
      const currentUserRole = req.user!.role;
      const contacts = await messagesService.listContacts(currentUserId, currentUserRole);
      res.json({ success: true, data: contacts });
    } catch (err) {
      next(err);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = req.user!.id;
      const otherUserId = req.params.userId;
      const result = await messagesService.getConversation(currentUserId, otherUserId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = req.user!.id;
      const { receiverId, content } = req.body;
      const message = await messagesService.sendMessage(senderId, receiverId, content);
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await messagesService.getUnreadCount(req.user!.id);
      res.json({ success: true, data: { unreadCount: count } });
    } catch (err) {
      next(err);
    }
  }
}
