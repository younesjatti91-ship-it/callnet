import { AppDataSource } from '../../database/dataSource';
import {
  WhatsAppConnection,
  WhatsAppStatusEnum,
  MessageBroadcast,
  BroadcastStatusEnum,
  MessageDeliveryLog,
  MessageDeliveryStatusEnum,
  Store,
  WhatsAppContact,
} from '../../database/entities';
import { WahaClient } from './waha.client';
import { logger } from '../../utils/logger';

export class WhatsAppService {
  private waRepo = AppDataSource.getRepository(WhatsAppConnection);
  private broadcastRepo = AppDataSource.getRepository(MessageBroadcast);
  private logRepo = AppDataSource.getRepository(MessageDeliveryLog);
  private storeRepo = AppDataSource.getRepository(Store);
  private contactRepo = AppDataSource.getRepository(WhatsAppContact);
  private wahaClient = new WahaClient();

  async checkEngineHealth() {
    return this.wahaClient.checkHealth();
  }

  async listSessions(storeId: string) {
    let sessions = await this.waRepo.find({
      where: { storeId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });

    // Auto-discover sessions in WAHA that belong to this store or are active
    try {
      const liveSessions = await this.wahaClient.listSessions();
      const store = await this.storeRepo.findOne({ where: { id: storeId } });
      const cleanSlug = (store?.slug || storeId.slice(0, 8)).replace(/[^a-zA-Z0-9]/g, '_');

      for (const ls of liveSessions) {
        if (!ls.name) continue;
        const belongsToStore = ls.name.includes(cleanSlug) || ls.name === `store_${cleanSlug}_primary`;
        if (belongsToStore && !sessions.find((s) => s.sessionName === ls.name)) {
          const newSession = this.waRepo.create({
            storeId,
            sessionName: ls.name,
            engine: 'WEBJS',
            status: (ls.status as any) || WhatsAppStatusEnum.WORKING,
            connectedPhone: ls.me?.id ? ls.me.id.replace(/[^0-9]/g, '') : undefined,
            label: ls.me?.pushName ? `${ls.me.pushName}'s Line` : 'Primary WhatsApp Line',
            isDefault: sessions.length === 0,
          });
          const saved = await this.waRepo.save(newSession);
          sessions.push(saved);
        }
      }
    } catch {}

    if (sessions.length === 0) {
      // Auto initialize default session for store
      const defaultConn = await this.getStoreConnection(storeId);
      sessions = [defaultConn];
    }

    // Always sync status and phone with live WAHA container
    for (const s of sessions) {
      try {
        const live = await this.wahaClient.getSession(s.sessionName);
        let changed = false;
        if (live?.status && live.status !== s.status) {
          s.status = live.status as WhatsAppStatusEnum;
          changed = true;
        }
        if (live?.me?.id) {
          const clean = live.me.id.replace(/[^0-9]/g, '');
          if (s.connectedPhone !== clean) {
            s.connectedPhone = clean;
            changed = true;
          }
        }
        if (changed) {
          await this.waRepo.save(s);
        }
      } catch {}
    }

    return sessions;
  }

  async updateSession(storeId: string, sessionId: string, data: { label?: string; isDefault?: boolean }) {
    const conn = await this.getStoreConnection(storeId, sessionId);
    if (data.label !== undefined) {
      conn.label = data.label.trim();
    }
    if (data.isDefault !== undefined && data.isDefault) {
      await this.waRepo.update({ storeId }, { isDefault: false });
      conn.isDefault = true;
    }
    return this.waRepo.save(conn);
  }

  async getStoreConnection(storeId: string, sessionId?: string) {
    if (sessionId && sessionId !== 'undefined' && sessionId !== 'default') {
      const specificConn = await this.waRepo.findOne({
        where: [{ id: sessionId, storeId }, { sessionName: sessionId, storeId }],
      });
      if (specificConn) return specificConn;
    }

    // Prefer WORKING session first, then isDefault, then first available
    let conn = await this.waRepo.findOne({ where: { storeId, status: WhatsAppStatusEnum.WORKING } });
    if (!conn) {
      conn = await this.waRepo.findOne({ where: { storeId, isDefault: true } });
    }
    if (!conn) {
      conn = await this.waRepo.findOne({ where: { storeId } });
    }

    if (!conn) {
      const store = await this.storeRepo.findOne({ where: { id: storeId } });
      const cleanSlug = (store?.slug || storeId.slice(0, 8)).replace(/[^a-zA-Z0-9]/g, '_');
      const sessionName = `store_${cleanSlug}_primary`;
      conn = await this.waRepo.save(
        this.waRepo.create({
          storeId,
          sessionName,
          engine: 'WEBJS',
          status: WhatsAppStatusEnum.STOPPED,
          label: 'Primary Store Line',
          isDefault: true,
        })
      );
    }
    return conn;
  }

  async createSession(
    storeId: string,
    data: { phoneNumber?: string; label?: string; engine?: string; isDefault?: boolean }
  ) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    const cleanPhone = (data.phoneNumber || '').replace(/[^0-9]/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanSlug = (store?.slug || storeId.slice(0, 8)).replace(/[^a-zA-Z0-9]/g, '_');
    const sessionName = cleanPhone
      ? `store_${cleanSlug}_${cleanPhone}`
      : `store_${cleanSlug}_line_${randSuffix}`;

    // Check if session with this phone or sessionName already exists for store
    let existing = await this.waRepo.findOne({
      where: [{ storeId, sessionName }, ...(cleanPhone ? [{ storeId, connectedPhone: cleanPhone }] : [])],
    });

    if (existing) {
      if (data.label) existing.label = data.label;
      existing.engine = data.engine || 'WEBJS';
      if (data.isDefault) {
        await this.waRepo.update({ storeId }, { isDefault: false });
        existing.isDefault = true;
      }
      const saved = await this.waRepo.save(existing);
      try {
        await this.wahaClient.startSession(saved.sessionName, saved.engine);
      } catch {}
      return saved;
    }

    if (data.isDefault) {
      await this.waRepo.update({ storeId }, { isDefault: false });
    }

    const session = this.waRepo.create({
      storeId,
      sessionName,
      engine: data.engine || 'WEBJS',
      status: WhatsAppStatusEnum.STARTING,
      connectedPhone: cleanPhone || undefined,
      label: data.label || (cleanPhone ? `Phone +${cleanPhone}` : `WhatsApp Line #${randSuffix}`),
      isDefault: data.isDefault !== undefined ? data.isDefault : false,
    });

    const savedSession = await this.waRepo.save(session);

    // Immediately start session in WAHA container so QR code generates right away
    try {
      const wahaRes = await this.wahaClient.startSession(savedSession.sessionName, savedSession.engine);
      if (wahaRes?.status) {
        savedSession.status = wahaRes.status as WhatsAppStatusEnum;
        await this.waRepo.save(savedSession);
      }
    } catch (e: any) {
      logger.warn(`Could not pre-start session ${savedSession.sessionName}: ${e.message}`);
    }

    return savedSession;
  }

  async connectSession(storeId: string, sessionId?: string, engine: string = 'WEBJS') {
    const conn = await this.getStoreConnection(storeId, sessionId);
    conn.engine = engine || 'WEBJS';

    try {
      const wahaSession = await this.wahaClient.startSession(conn.sessionName, conn.engine);
      conn.status = (wahaSession.status as WhatsAppStatusEnum) || WhatsAppStatusEnum.STARTING;
      if (wahaSession.me?.id) {
        conn.connectedPhone = wahaSession.me.id.replace('@c.us', '');
      }

      if (conn.status === WhatsAppStatusEnum.SCAN_QR_CODE) {
        conn.qrCodeRaw = (await this.wahaClient.getQRCode(conn.sessionName)) || undefined;
      }
    } catch (err: any) {
      conn.status = WhatsAppStatusEnum.STARTING;
      logger.warn(`Connecting WAHA session ${conn.sessionName}: ${err.message}`);
    }

    return this.waRepo.save(conn);
  }

  async getSessionStatus(storeId: string, sessionId?: string) {
    const conn = await this.getStoreConnection(storeId, sessionId);
    try {
      const wahaSession = await this.wahaClient.getSession(conn.sessionName);
      conn.status = wahaSession.status as WhatsAppStatusEnum;
      if (wahaSession.me?.id) {
        conn.connectedPhone = wahaSession.me.id.replace('@c.us', '');
      }
      await this.waRepo.save(conn);
    } catch (err) {
      // Keep existing status
    }
    return conn;
  }

  async setDefaultSession(storeId: string, sessionId: string) {
    await this.waRepo.update({ storeId }, { isDefault: false });
    await this.waRepo.update({ storeId, id: sessionId }, { isDefault: true });
    return this.getStoreConnection(storeId, sessionId);
  }

  async deleteSession(storeId: string, sessionId: string) {
    const conn = await this.waRepo.findOne({ where: { id: sessionId, storeId } });
    if (!conn) throw { statusCode: 404, code: 'NOT_FOUND', message: 'WhatsApp session not found' };

    try {
      // Sends explicit logout & delete to WAHA so WhatsApp servers unlink the phone
      await this.wahaClient.deleteSession(conn.sessionName);
    } catch {
      // Ignore errors on delete
    }

    await this.waRepo.remove(conn);
    return { success: true, deletedSessionId: sessionId };
  }

  async sendMedia(
    storeId: string,
    sessionId: string | undefined,
    chatId: string,
    file: { mimetype: string; filename: string; data?: string; url?: string },
    caption?: string
  ) {
    const conn = await this.getStoreConnection(storeId, sessionId);
    return this.wahaClient.sendFile(conn.sessionName, chatId, file, caption);
  }

  async getMediaStream(mediaUrl: string) {
    return this.wahaClient.fetchMediaStream(mediaUrl);
  }

  async sendMessage(
    storeId: string,
    options: {
      to: string;
      message: string;
      orderId?: string;
      broadcastId?: string;
      sessionId?: string;
    }
  ) {
    const conn = await this.getStoreConnection(storeId, options.sessionId);

    // 1. Create delivery log in QUEUED state
    const deliveryLog = this.logRepo.create({
      storeId,
      orderId: options.orderId,
      broadcastId: options.broadcastId,
      recipientPhone: options.to,
      messageContent: options.message,
      status: MessageDeliveryStatusEnum.QUEUED,
    });
    await this.logRepo.save(deliveryLog);

    // 2. Dispatch via WAHA
    try {
      const sendResult = await this.wahaClient.sendText(conn.sessionName, options.to, options.message);
      deliveryLog.externalMessageId = sendResult.id;
      deliveryLog.status = MessageDeliveryStatusEnum.SENT;
    } catch (err: any) {
      deliveryLog.status = MessageDeliveryStatusEnum.FAILED;
      deliveryLog.errorMessage = err.message;
      logger.error(`Failed to dispatch message to ${options.to}: ${err.message}`);
    }

    return this.logRepo.save(deliveryLog);
  }

  async createBroadcast(
    storeId: string,
    data: {
      name: string;
      templateBody: string;
      recipientPhones: string[];
      throttleMs?: number;
    }
  ) {
    const throttleMs = data.throttleMs || 2000;
    const broadcast = this.broadcastRepo.create({
      storeId,
      name: data.name,
      templateBody: data.templateBody,
      status: BroadcastStatusEnum.PROCESSING,
      totalRecipients: data.recipientPhones.length,
      throttleMs,
    });
    const savedBroadcast = await this.broadcastRepo.save(broadcast);

    // Asynchronously dispatch messages with throttling delay to prevent WhatsApp account rate limits
    (async () => {
      let sent = 0;
      let failed = 0;

      for (const phone of data.recipientPhones) {
        try {
          await this.sendMessage(storeId, {
            to: phone,
            message: data.templateBody,
            broadcastId: savedBroadcast.id,
          });
          sent += 1;
        } catch (err) {
          failed += 1;
        }

        // Throttle interval between messages
        if (throttleMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(throttleMs, 5000)));
        }
      }

      savedBroadcast.sentCount = sent;
      savedBroadcast.failedCount = failed;
      savedBroadcast.status = BroadcastStatusEnum.COMPLETED;
      await this.broadcastRepo.save(savedBroadcast);
    })().catch((err) => {
      logger.error(`Broadcast background dispatch error: ${err.message}`);
    });

    return savedBroadcast;
  }

  async handleWebhookEvent(event: any) {
    logger.info('WAHA Webhook Event Received', { event: event.event, session: event.session });

    // Handle ACK events (delivered, read)
    if (event.event === 'message.ack') {
      const msgId = event.payload?.id?._serialized || event.payload?.id;
      const ackCode = event.payload?.ack; // 1 = sent, 2 = received/delivered, 3 = read

      if (msgId) {
        const log = await this.logRepo.findOne({ where: { externalMessageId: msgId } });
        if (log) {
          if (ackCode === 3) log.status = MessageDeliveryStatusEnum.READ;
          else if (ackCode === 2) log.status = MessageDeliveryStatusEnum.DELIVERED;
          else if (ackCode === 1) log.status = MessageDeliveryStatusEnum.SENT;
          await this.logRepo.save(log);
        }
      }
    }

    return { received: true };
  }

  async getDeliveryLogs(storeId: string, options: { orderId?: string; broadcastId?: string; limit?: number } = {}) {
    const limit = options.limit || 50;
    const where: any = { storeId };
    if (options.orderId) where.orderId = options.orderId;
    if (options.broadcastId) where.broadcastId = options.broadcastId;

    return this.logRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async listBroadcasts(storeId: string) {
    return this.broadcastRepo.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });
  }

  async getQRCode(storeId: string, sessionId?: string) {
    const conn = await this.getStoreConnection(storeId, sessionId);

    // 1. Check live session status on WAHA
    let wahaStatus = conn.status;
    try {
      const statusRes = await this.wahaClient.getSession(conn.sessionName);
      if (statusRes?.status) {
        wahaStatus = statusRes.status as WhatsAppStatusEnum;
      }
    } catch {}

    // 2. If stopped or failed, auto-start it
    if (wahaStatus === WhatsAppStatusEnum.STOPPED || wahaStatus === WhatsAppStatusEnum.FAILED) {
      try {
        const started = await this.wahaClient.startSession(conn.sessionName, conn.engine || 'WEBJS');
        if (started?.status) {
          wahaStatus = started.status as WhatsAppStatusEnum;
        }
      } catch {}
    }

    // 3. Attempt to fetch QR code
    let qr = await this.wahaClient.getQRCode(conn.sessionName);

    if (wahaStatus === WhatsAppStatusEnum.WORKING) {
      conn.status = WhatsAppStatusEnum.WORKING;
      try {
        const sessionInfo = await this.wahaClient.getSession(conn.sessionName);
        if (sessionInfo.me?.id) conn.connectedPhone = sessionInfo.me.id.replace('@c.us', '');
      } catch {}
    } else if (qr) {
      conn.status = WhatsAppStatusEnum.SCAN_QR_CODE;
      conn.qrCodeRaw = qr;
    } else {
      conn.status = wahaStatus || WhatsAppStatusEnum.STARTING;
    }

    await this.waRepo.save(conn);

    return {
      sessionName: conn.sessionName,
      status: conn.status,
      connectedPhone: conn.connectedPhone,
      qr,
    };
  }

  async getSessionChats(storeId: string, sessionId?: string) {
    const conn = await this.getStoreConnection(storeId, sessionId);
    const chats = await this.wahaClient.getChats(conn.sessionName);

    // Persist every contact from the conversation list into the DB so the seller can promote to them later
    if (Array.isArray(chats) && chats.length > 0) {
      (async () => {
        for (const c of chats) {
          try {
            const rawPhone = (
              c.phoneNumber ||
              (c.id?.includes('@c.us') ? c.id.replace('@c.us', '') : c.id) ||
              ''
            ).replace(/[^0-9]/g, '');
            const phone = rawPhone ? `+${rawPhone}` : c.id;
            const name = c.name || (c as any).pushname || 'WhatsApp Contact';

            let existing = await this.contactRepo.findOne({ where: { storeId, chatId: c.id } });
            if (existing) {
              if (name && name !== 'WhatsApp Contact') existing.name = name;
              if (c.lastMessage?.body) existing.lastMessage = c.lastMessage.body;
              if (c.lastMessage?.timestamp) {
                existing.lastMessageTimestamp = new Date(c.lastMessage.timestamp * 1000);
              }
              if (c.unreadCount !== undefined) existing.unreadCount = c.unreadCount;
              await this.contactRepo.save(existing);
            } else {
              await this.contactRepo.save(
                this.contactRepo.create({
                  storeId,
                  chatId: c.id,
                  phone,
                  name,
                  lastMessage: c.lastMessage?.body || '',
                  lastMessageTimestamp: c.lastMessage?.timestamp ? new Date(c.lastMessage.timestamp * 1000) : new Date(),
                  unreadCount: c.unreadCount || 0,
                  tags: ['inquired', 'potential_lead'],
                  source: 'whatsapp_conversation',
                  hasOrdered: false,
                })
              );
            }
          } catch (err: any) {
            logger.warn(`Failed to upsert WhatsApp contact into DB: ${err.message}`);
          }
        }
      })().catch(() => {});
    }

    return chats;
  }

  async getStoredContacts(storeId: string) {
    return this.contactRepo.find({
      where: { storeId },
      order: { lastMessageTimestamp: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateStoredContact(
    storeId: string,
    data: {
      chatId?: string;
      phone?: string;
      name: string;
      tags?: string[];
    }
  ) {
    let contact: WhatsAppContact | null = null;

    if (data.chatId) {
      contact = await this.contactRepo.findOne({ where: { storeId, chatId: data.chatId } });
    }
    if (!contact && data.phone) {
      const cleanPhone = data.phone.replace(/[^0-9+]/g, '');
      contact = await this.contactRepo.findOne({ where: { storeId, phone: cleanPhone } });
    }

    if (!contact) {
      const rawDigits = (data.phone || data.chatId || '').replace(/[^0-9]/g, '');
      contact = this.contactRepo.create({
        storeId,
        chatId: data.chatId || `${rawDigits}@c.us`,
        phone: data.phone || (rawDigits ? `+${rawDigits}` : '+21200000000'),
        name: data.name.trim(),
        source: 'manual_save',
        tags: data.tags || ['verified_lead'],
        lastMessageTimestamp: new Date(),
      });
    } else {
      contact.name = data.name.trim();
      if (data.tags) contact.tags = data.tags;
    }

    const saved = await this.contactRepo.save(contact);
    logger.info(`WhatsApp contact updated for store ${storeId}: ${saved.name} (${saved.phone})`);
    return saved;
  }

  async getSessionContacts(storeId: string, sessionId?: string) {
    const conn = await this.getStoreConnection(storeId, sessionId);
    return this.wahaClient.getContacts(conn.sessionName);
  }

  async getSessionMessages(storeId: string, sessionId: string | undefined, chatId: string, limit?: number) {
    const conn = await this.getStoreConnection(storeId, sessionId);
    return this.wahaClient.getMessages(conn.sessionName, chatId, limit);
  }
}

