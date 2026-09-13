import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface WahaSessionResponse {
  name: string;
  status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
  config?: any;
  me?: { id: string; pushName: string };
}

export interface WahaChat {
  id: string;
  name: string;
  phoneNumber?: string;
  hasRecentActivity?: boolean;
  unreadCount?: number;
  timestamp?: number;
  lastMessage?: {
    id: string;
    body: string;
    timestamp: number;
    fromMe: boolean;
  };
}

export interface WahaContact {
  id: string;
  name?: string;
  pushname?: string;
  number?: string;
  isMyContact?: boolean;
}

export interface WahaMessage {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  body: string;
  fromMe: boolean;
  hasMedia?: boolean;
}

export class WahaClient {
  private api: AxiosInstance;
  private isMock: boolean;

  constructor() {
    this.isMock = config.waha.mockMode;
    this.api = axios.create({
      baseURL: config.waha.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.waha.apiKey ? { 'X-Api-Key': config.waha.apiKey } : {}),
      },
      timeout: 10000,
    });
  }

  async checkHealth(): Promise<{ isAlive: boolean; version?: string; mode: string }> {
    if (this.isMock) {
      return { isAlive: true, version: '2026.1-mock', mode: 'mock' };
    }
    try {
      const res = await this.api.get('/api/version', { timeout: 4000 });
      return { isAlive: true, version: res.data?.version || 'live', mode: 'docker-live' };
    } catch {
      try {
        const res = await this.api.get('/api/server/version', { timeout: 4000 });
        return { isAlive: true, version: res.data?.version || 'live', mode: 'docker-live' };
      } catch {
        return { isAlive: false, mode: 'docker-unreachable' };
      }
    }
  }

  async startSession(name: string, engine: string = 'WEBJS'): Promise<WahaSessionResponse> {
    if (this.isMock) {
      logger.info(`[WAHA Mock] Starting session '${name}' with engine '${engine}'`);
      return {
        name,
        status: 'SCAN_QR_CODE',
        me: { id: '212600112233@c.us', pushName: 'COD Store Support' },
      };
    }

    // 1. Check if session already exists in WAHA
    try {
      const existing = await this.getSession(name);
      // If already active or starting, return directly without disturbing it
      if (existing && (existing.status === 'WORKING' || existing.status === 'SCAN_QR_CODE' || existing.status === 'STARTING')) {
        return existing;
      }
      // If stopped or failed, restart it
      if (existing && (existing.status === 'STOPPED' || existing.status === 'FAILED')) {
        try {
          await this.api.post(`/api/sessions/${name}/start`);
          return await this.getSession(name);
        } catch {}
      }
    } catch {}

    // 2. Create new session in WAHA if it doesn't exist
    try {
      const response = await this.api.post('/api/sessions', {
        name,
        start: true,
      });
      return response.data;
    } catch (err: any) {
      // If already exists or error, fetch current state
      try {
        return await this.getSession(name);
      } catch {
        return { name, status: 'STARTING' };
      }
    }
  }

  async stopSession(name: string): Promise<void> {
    if (this.isMock) {
      logger.info(`[WAHA Mock] Stopped session '${name}'`);
      return;
    }

    try {
      await this.api.post(`/api/sessions/${name}/stop`);
    } catch {
      try {
        await this.api.post('/api/sessions/stop', { name });
      } catch (err: any) {
        logger.error(`WAHA stopSession error: ${err.message}`);
      }
    }
  }

  async deleteSession(name: string): Promise<void> {
    if (this.isMock) {
      logger.info(`[WAHA Mock] Deleted session '${name}'`);
      return;
    }

    try {
      // 1. Explicitly unpair and logout from WhatsApp so it vanishes from the phone's linked devices
      await this.api.post(`/api/sessions/${name}/logout`);
    } catch {}

    try {
      // 2. Delete the session completely from WAHA
      await this.api.delete(`/api/sessions/${name}`);
    } catch (err: any) {
      logger.warn(`WAHA deleteSession error for '${name}': ${err.message}`);
    }
  }

  async listSessions(): Promise<WahaSessionResponse[]> {
    if (this.isMock) return [];
    try {
      const res = await this.api.get('/api/sessions?all=true', { timeout: 6000 });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  async getSession(name: string): Promise<WahaSessionResponse> {
    if (this.isMock) {
      return {
        name,
        status: 'WORKING',
        me: { id: '212600112233@c.us', pushName: 'COD Store Support' },
      };
    }

    try {
      const response = await this.api.get(`/api/sessions/${name}`);
      return response.data;
    } catch (err: any) {
      return { name, status: 'STOPPED' };
    }
  }

  async getQRCode(name: string): Promise<string | null> {
    if (this.isMock) {
      // Interactive SVG QR Code Data URL for offline testing
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
        <rect width="240" height="240" fill="#ffffff" rx="12"/>
        <rect x="20" y="20" width="60" height="60" fill="#1e293b" rx="4"/>
        <rect x="30" y="30" width="40" height="40" fill="#ffffff"/>
        <rect x="40" y="40" width="20" height="20" fill="#1e293b"/>
        <rect x="160" y="20" width="60" height="60" fill="#1e293b" rx="4"/>
        <rect x="170" y="30" width="40" height="40" fill="#ffffff"/>
        <rect x="180" y="40" width="20" height="20" fill="#1e293b"/>
        <rect x="20" y="160" width="60" height="60" fill="#1e293b" rx="4"/>
        <rect x="30" y="170" width="40" height="40" fill="#ffffff"/>
        <rect x="40" y="180" width="20" height="20" fill="#1e293b"/>
        <circle cx="120" cy="120" r="18" fill="#22c55e"/>
        <path d="M115 120 l4 4 l8 -8" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <text x="120" y="215" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">SCAN WITH WHATSAPP</text>
      </svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    try {
      // WAHA returns binary PNG when format=image
      const res = await this.api.get(`/api/${name}/auth/qr?format=image`, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });
      const base64 = Buffer.from(res.data).toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (err: any) {
      return null;
    }
  }

  async getChats(name: string): Promise<WahaChat[]> {
    if (this.isMock) {
      return [
        {
          id: '212612345678@c.us',
          name: 'Youssef El Amrani',
          unreadCount: 0,
          timestamp: Date.now() - 3600000,
          lastMessage: {
            id: 'mock-msg-1',
            body: 'Salam, I confirm the order for Casablanca tomorrow.',
            timestamp: Date.now() - 3600000,
            fromMe: false,
          },
        },
        {
          id: '212678912345@c.us',
          name: 'Fatima Bennani',
          unreadCount: 1,
          timestamp: Date.now() - 7200000,
          lastMessage: {
            id: 'mock-msg-2',
            body: 'Can you please deliver after 4 PM?',
            timestamp: Date.now() - 7200000,
            fromMe: false,
          },
        },
      ];
    }

    try {
      // 1. Build LID to real phone number map from WAHA contacts
      const lidMap = new Map<string, { phone: string; name?: string }>();
      try {
        const contactsRes = await this.api.get(`/api/contacts/all?session=${name}`, { timeout: 10000 });
        if (Array.isArray(contactsRes.data)) {
          for (const c of contactsRes.data) {
            const rawId = c.id?._serialized || (typeof c.id === 'string' ? c.id : '');
            const num = c.number;
            if (rawId.endsWith('@c.us') && num && num.length > 13) {
              const phone = rawId.replace('@c.us', '');
              const cName = c.name || c.pushname;
              lidMap.set(num, { phone, name: cName });
              lidMap.set(num + '@lid', { phone, name: cName });
            }
          }
        }
      } catch {}

      // 2. Fetch chats
      const res = await this.api.get(`/api/${name}/chats/`, { timeout: 15000 });
      const rawChats = Array.isArray(res.data) ? res.data : [];
      const parsedChats = rawChats.map((c: any) => {
        const rawId = c.id?._serialized || (typeof c.id === 'string' ? c.id : String(c.id?.user || ''));
        const lidMatch = lidMap.get(rawId) || lidMap.get(rawId.replace('@lid', ''));

        // Real Moroccan/international phone number (e.g. 212637587746)
        const realPhone = lidMatch?.phone || (rawId.endsWith('@c.us') ? rawId.replace('@c.us', '') : '');
        // Friendly contact name
        const contactName = c.name || lidMatch?.name || c.pushname || (realPhone ? `+${realPhone}` : rawId);

        const rawTs = c.timestamp || c.lastMessage?.timestamp || c.lastMessage?.t;
        const ts = rawTs ? (rawTs > 1e11 ? rawTs : rawTs * 1000) : Date.now();
        const lastMsgTs = c.lastMessage?.timestamp ? (c.lastMessage.timestamp > 1e11 ? c.lastMessage.timestamp : c.lastMessage.timestamp * 1000) : ts;

        return {
          id: rawId,
          phoneNumber: realPhone,
          name: contactName,
          unreadCount: c.unreadCount || 0,
          timestamp: ts,
          hasRecentActivity: Boolean(c.lastMessage),
          lastMessage: c.lastMessage ? {
            id: c.lastMessage.id?._serialized || c.lastMessage.id || '',
            body: c.lastMessage.body || (c.lastMessage.hasMedia ? '📷 [Media / Voice Note]' : ''),
            timestamp: lastMsgTs,
            fromMe: Boolean(c.lastMessage.fromMe),
          } : undefined,
        };
      });

      // Sort chats so most recently active chats appear at the top
      return parsedChats.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch {
      return [];
    }
  }

  async getContacts(name: string): Promise<WahaContact[]> {
    if (this.isMock) {
      return [
        { id: '212612345678@c.us', name: 'Youssef El Amrani', pushname: 'Youssef', number: '212612345678' },
        { id: '212678912345@c.us', name: 'Fatima Bennani', pushname: 'Fatima', number: '212678912345' },
        { id: '212654321098@c.us', name: 'Karim Idrissi', pushname: 'Karim', number: '212654321098' },
      ];
    }

    try {
      const res = await this.api.get(`/api/contacts/all?session=${name}`, { timeout: 15000 });
      const rawContacts = Array.isArray(res.data) ? res.data : [];

      const cleanList: WahaContact[] = [];
      const seenPhones = new Set<string>();

      for (const c of rawContacts) {
        const rawId = c.id?._serialized || (typeof c.id === 'string' ? c.id : '');
        // Ignore groups and status broadcasts
        if (c.isGroup || rawId.includes('@g.us') || rawId.includes('@broadcast')) continue;

        // Extract real phone number
        let phone = '';
        if (rawId.endsWith('@c.us')) {
          phone = rawId.replace('@c.us', '').replace(/[^0-9]/g, '');
        } else if (c.number && c.number.length <= 13 && !c.number.startsWith('10') && !c.number.startsWith('11') && !c.number.startsWith('12')) {
          phone = c.number.replace(/[^0-9]/g, '');
        }

        // Only include contacts with actual phone numbers and deduplicate
        if (phone && !seenPhones.has(phone)) {
          seenPhones.add(phone);
          const contactName = c.name || c.pushname || c.shortName || `+${phone}`;
          cleanList.push({
            id: `${phone}@c.us`,
            name: contactName,
            pushname: c.pushname || '',
            number: phone,
            isMyContact: Boolean(c.isMyContact),
          });
        }
      }

      // Sort with actual saved phone contacts first
      return cleanList.sort((a: any, b: any) => (b.isMyContact ? 1 : 0) - (a.isMyContact ? 1 : 0));
    } catch {
      return [];
    }
  }

  async getMessages(name: string, chatId: string, limit?: number): Promise<WahaMessage[]> {
    const cleanChatId = decodeURIComponent(chatId);
    const normalizedChatId = cleanChatId.includes('@') ? cleanChatId : `${cleanChatId.replace(/[^0-9]/g, '')}@c.us`;

    const historyDays = config.waha.historyDays ?? 7;
    const fetchLimit = limit || config.waha.messageLimit || 100;
    const cutoffTimestamp = historyDays > 0 ? (Date.now() - historyDays * 24 * 60 * 60 * 1000) : 0;

    if (this.isMock) {
      return [
        {
          id: 'mock-m-1',
          timestamp: Date.now() - 7200000,
          from: name,
          to: normalizedChatId,
          body: 'Hello! Thank you for ordering from our store. Your order is being verified.',
          fromMe: true,
        },
        {
          id: 'mock-m-2',
          timestamp: Date.now() - 3600000,
          from: normalizedChatId,
          to: name,
          body: 'Salam, yes I confirm the order for Casablanca tomorrow.',
          fromMe: false,
        },
        {
          id: 'mock-m-3',
          timestamp: Date.now() - 1800000,
          from: name,
          to: normalizedChatId,
          body: 'Great! Our courier will deliver to you tomorrow between 10am and 4pm.',
          fromMe: true,
        },
      ];
    }

    try {
      const res = await this.api.get(`/api/${name}/chats/${encodeURIComponent(normalizedChatId)}/messages`, {
        params: { limit: fetchLimit },
        timeout: 20000,
      });
      const rawMsgs = Array.isArray(res.data) ? res.data : [];
      const parsed: WahaMessage[] = rawMsgs.map((m: any) => {
        const rawTs = m.timestamp || m.t || m._data?.t;
        const ts = rawTs ? (rawTs > 1e11 ? rawTs : rawTs * 1000) : Date.now();
        return {
          id: m.id?._serialized || (typeof m.id === 'string' ? m.id : String(m.id)),
          timestamp: ts,
          from: m.from?._serialized || (typeof m.from === 'string' ? m.from : String(m.from || '')),
          to: m.to?._serialized || (typeof m.to === 'string' ? m.to : String(m.to || '')),
          body: m.body || '',
          fromMe: Boolean(m.fromMe),
          hasMedia: Boolean(m.hasMedia || m.type === 'image' || m.type === 'ptt' || m.type === 'audio' || m.type === 'video' || m.type === 'document'),
          media: m.media ? {
            url: m.media.url || '',
            filename: m.media.filename || '',
            mimetype: m.media.mimetype || m._data?.mimetype || '',
          } : (m.hasMedia && m._data?.mimetype ? {
            url: '',
            filename: m._data?.filename || '',
            mimetype: m._data.mimetype,
          } : undefined),
        };
      });

      // If configured for history days (default 7 days), filter to messages within that range
      if (cutoffTimestamp > 0) {
        const recent = parsed.filter((m) => m.timestamp >= cutoffTimestamp);
        return recent.length > 0 ? recent : parsed;
      }

      return parsed;
    } catch (err: any) {
      logger.warn(`WAHA getMessages for ${normalizedChatId} failed: ${err.message}`);
      return [];
    }
  }

  async sendText(name: string, chatId: string, text: string): Promise<{ id: string; timestamp: number }> {
    const normalizedChatId = chatId.includes('@') ? chatId : `${chatId.replace(/[^0-9]/g, '')}@c.us`;

    if (this.isMock) {
      const mockId = `wamid.mock.${Date.now()}.${Math.floor(Math.random() * 1000)}`;
      logger.info(`[WAHA Mock] Sent message to ${normalizedChatId}: "${text.slice(0, 60)}..." (ID: ${mockId})`);
      return { id: mockId, timestamp: Date.now() };
    }

    try {
      const response = await this.api.post('/api/sendText', {
        session: name,
        chatId: normalizedChatId,
        text,
      });
      return response.data;
    } catch (err: any) {
      logger.error(`WAHA sendText error: ${err.message}`);
      throw new Error(`Failed to send WhatsApp message: ${err.response?.data?.message || err.message}`);
    }
  }

  async sendFile(
    name: string,
    chatId: string,
    file: { mimetype: string; filename: string; data?: string; url?: string },
    caption?: string
  ): Promise<{ id: string; timestamp: number }> {
    const normalizedChatId = chatId.includes('@') ? chatId : `${chatId.replace(/[^0-9]/g, '')}@c.us`;

    if (this.isMock) {
      const mockId = `wamid.mock.file.${Date.now()}`;
      logger.info(`[WAHA Mock] Sent file to ${normalizedChatId}: ${file.filename} (ID: ${mockId})`);
      return { id: mockId, timestamp: Date.now() };
    }

    try {
      const response = await this.api.post('/api/sendFile', {
        session: name,
        chatId: normalizedChatId,
        file,
        caption: caption || '',
      });
      return response.data;
    } catch (err: any) {
      logger.error(`WAHA sendFile error: ${err.message}`);
      throw new Error(`Failed to send WhatsApp file: ${err.response?.data?.message || err.message}`);
    }
  }

  async fetchMediaStream(fileUrl: string) {
    if (this.isMock) return null;
    return this.api.get(fileUrl, { responseType: 'stream' });
  }
}
