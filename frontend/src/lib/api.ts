const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface OrderItem {
  id?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  storeId: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city?: string;
  province?: string;
  shippingAddress?: string;
  subtotal: number;
  shippingFee: number;
  codAmount: number;
  currency: string;
  assignedAgentId?: string;
  callAttemptsCount: number;
  lastCallAttemptAt?: string;
  scheduledCallbackAt?: string;
  source: string;
  statusCode?: string;
  substatus?: string;
  contactIterations?: number;
  lastComment?: string;
  courierCompanyId?: string;
  courierAccountId?: string;
  trackingNumber?: string;
  courierName?: string;
  remittanceStatus: string;
  notes?: string;
  cancellationReason?: string;
  items?: OrderItem[];
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  currency: string;
  locale: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Metrics {
  totalOrders: number;
  totalCodPipeline: number;
  totalCashDelivered: number;
  pendingVerification: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  returned: number;
  cancelled: number;
  confirmationRate: number;
  deliverySuccessRate: number;
  returnRate: number;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('codflow_token');
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('codflow_token', token);
    }
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('codflow_token');
      localStorage.removeItem('codflow_user');
      localStorage.removeItem('codflow_stores');
      localStorage.removeItem('codflow_current_store');
    }
  }

  setSession(data: { token?: string; user?: any; stores?: any[] }) {
    if (typeof window !== 'undefined') {
      if (data.token) localStorage.setItem('codflow_token', data.token);
      if (data.user) localStorage.setItem('codflow_user', JSON.stringify(data.user));
      if (data.stores && data.stores.length > 0) {
        localStorage.setItem('codflow_stores', JSON.stringify(data.stores));
        // Only set current store if not already set or invalid
        const current = this.getCurrentStore();
        if (!current || !data.stores.some(s => s.id === current.id)) {
          localStorage.setItem('codflow_current_store', JSON.stringify(data.stores[0]));
        }
      }
    }
  }

  getCurrentStore(): { id: string; name: string; currency: string } | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('codflow_current_store');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return null;
  }

  setCurrentStore(store: { id: string; name: string; currency: string }) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('codflow_current_store', JSON.stringify(store));
    }
  }

  getSavedStores(): Array<{ id: string; name: string; currency: string }> {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('codflow_stores');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return [];
  }

  getCurrentUser(): { name: string; email: string; role: string } | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('codflow_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return null;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'API request failed');
      }
      return json.data;
    } catch (err: any) {
      console.warn(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // Auth
  async login(email: string, passwordPlain: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: passwordPlain }),
    });
    if (data) this.setSession(data);
    return data;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    companyName?: string;
    phone?: string;
  }) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res) this.setSession(res);
    return res;
  }

  async getMe() {
    const res = await this.request('/auth/me');
    if (res?.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('codflow_user', JSON.stringify(res.user));
      }
    }
    return res;
  }

  async updateProfile(data: {
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const res = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res?.user && typeof window !== 'undefined') {
      localStorage.setItem('codflow_user', JSON.stringify(res.user));
    }
    return res;
  }

  // Store Integrations (Sellers submit their Store Name, URL, and APIs)
  async getStoreIntegrations(storeId: string) {
    return this.request(`/sellers/stores/${storeId}/integrations`);
  }

  async createStoreIntegration(storeId: string, data: {
    providerCode: string;
    accountName: string;
    externalShopDomain?: string;
    apiKey?: string;
    apiSecret?: string;
    apiConfig?: any;
  }) {
    return this.request(`/sellers/stores/${storeId}/integrations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteStoreIntegration(storeId: string, integrationId: string) {
    return this.request(`/sellers/stores/${storeId}/integrations/${integrationId}`, {
      method: 'DELETE',
    });
  }

  // Admin staff management
  async getAdminUsers(params: { role?: string; search?: string } = {}) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/admin/users${query ? `?${query}` : ''}`);
  }

  async createAdminUser(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    phoneNumber?: string;
    storeId?: string;
  }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminUser(userId: string, data: any) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async requestAgentChange(data: { storeId: string; agentId: string; reason: string; preferredCriteria?: string; notes?: string }) {
    return this.request('/sellers/agent-change-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Stores
  async getStores(sellerId?: string) {
    return this.request('/sellers/my/stores');
  }

  async getAllStores() {
    return this.request('/sellers/stores/all');
  }

  async getStore(storeId: string) {
    return this.request(`/sellers/stores/${storeId}`);
  }

  async createStore(data: {
    name: string;
    currency?: string;
    country?: string;
    phone?: string;
    fulfillmentType?: string;
    agentCommissionPerConfirmedOrder?: number;
    agentCommissionPerDeliveredOrder?: number;
  }) {
    return this.request('/sellers/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStore(storeId: string, data: any) {
    return this.request(`/sellers/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStore(storeId: string) {
    return this.request(`/sellers/stores/${storeId}`, {
      method: 'DELETE',
    });
  }

  async getStoreAgents(storeId: string) {
    return this.request(`/sellers/stores/${storeId}/agents`);
  }

  // Orders
  async getOrders(storeId: string, params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/orders/${storeId}${query ? `?${query}` : ''}`);
  }

  async getOrder(storeId: string, orderId: string) {
    return this.request(`/orders/${storeId}/${orderId}`);
  }

  async createOrder(storeId: string, orderData: any) {
    return this.request(`/orders/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(storeId: string, orderId: string, orderData: any) {
    return this.request(`/orders/${storeId}/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(storeId: string, orderId: string, statusData: any) {
    return this.request(`/orders/${storeId}/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  }

  async importCSV(storeId: string, rows: any[]) {
    return this.request(`/orders/${storeId}/import-csv`, {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  }

  // Call Center
  async getCallQueue(storeId: string, params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/call-center/queue/${storeId}${query ? `?${query}` : ''}`);
  }

  async recordCall(storeId: string, callData: any) {
    return this.request(`/call-center/calls/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  async getCallLogs(storeId: string, orderId: string) {
    return this.request(`/call-center/logs/${storeId}/${orderId}`);
  }

  // Couriers
  async getCourierCompanies() {
    return this.request('/couriers/companies');
  }

  async getCourierAccounts(storeId: string) {
    return this.request(`/couriers/accounts/${storeId}`);
  }

  async createCourierAccount(storeId: string, accountData: any) {
    return this.request(`/couriers/accounts/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async getShipments(storeId: string) {
    return this.request(`/couriers/shipments/${storeId}`);
  }

  async createShipment(storeId: string, shipmentData: any) {
    return this.request(`/couriers/shipments/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async testCourierConnection(storeId: string, data: { courierCode: string; apiKey?: string; apiSecret?: string; accountNumber?: string }) {
    return this.request(`/couriers/accounts/${storeId}/test-connection`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getShipmentLabelUrl(shipmentId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    return `${baseUrl}/couriers/shipments/${shipmentId}/label`;
  }

  // WAHA WhatsApp Engine & Multi-Session
  async getWhatsAppHealth() {
    return this.request('/whatsapp/health');
  }

  async getWhatsAppSessions(storeId: string) {
    return this.request(`/whatsapp/sessions/${storeId}`);
  }

  async createWhatsAppSession(storeId: string, data: { phoneNumber?: string; label?: string; engine?: string; isDefault?: boolean }) {
    return this.request(`/whatsapp/sessions/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWhatsAppSession(storeId: string, sessionId: string, data: { label?: string; isDefault?: boolean }) {
    return this.request(`/whatsapp/sessions/${storeId}/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async connectWhatsAppSession(storeId: string, sessionId: string, engine: string = 'NOWEB') {
    return this.request(`/whatsapp/sessions/${storeId}/${sessionId}/connect`, {
      method: 'POST',
      body: JSON.stringify({ engine }),
    });
  }

  async setDefaultWhatsAppSession(storeId: string, sessionId: string) {
    return this.request(`/whatsapp/sessions/${storeId}/${sessionId}/default`, {
      method: 'POST',
    });
  }

  async deleteWhatsAppSession(storeId: string, sessionId: string) {
    return this.request(`/whatsapp/sessions/${storeId}/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async getWhatsAppStatus(storeId: string, sessionId?: string) {
    if (sessionId) {
      return this.request(`/whatsapp/sessions/${storeId}/${sessionId}/status`);
    }
    return this.request(`/whatsapp/status/${storeId}`);
  }

  async getWhatsAppQR(storeId: string, sessionId: string) {
    return this.request(`/whatsapp/sessions/${storeId}/${sessionId}/qr`);
  }

  async getWhatsAppChats(storeId: string, sessionId: string) {
    return this.request(`/whatsapp/sessions/${storeId}/${sessionId}/chats`);
  }

  async getWhatsAppContacts(storeId: string, sessionId: string) {
    return this.request(`/whatsapp/sessions/${storeId}/${sessionId}/contacts`);
  }

  async getStoredWhatsAppContacts(storeId: string) {
    return this.request(`/whatsapp/stored-contacts/${storeId}`);
  }

  async updateStoredWhatsAppContact(
    storeId: string,
    data: { chatId?: string; phone?: string; name: string; tags?: string[] }
  ) {
    return this.request(`/whatsapp/stored-contacts/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getWhatsAppMessages(storeId: string, sessionId: string, chatId: string, limit: number = 50) {
    return this.request(`/whatsapp/sessions/${storeId}/${sessionId}/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}`);
  }

  async sendWhatsAppMedia(
    storeId: string,
    chatId: string,
    file: { filename: string; mimetype: string; data: string },
    caption?: string,
    sessionId?: string
  ) {
    return this.request(`/whatsapp/sessions/${storeId}/${sessionId}/chats/${encodeURIComponent(chatId)}/media`, {
      method: 'POST',
      body: JSON.stringify({ file, caption }),
    });
  }

  async connectWhatsApp(storeId: string, engine: string = 'NOWEB') {
    return this.request(`/whatsapp/connect/${storeId}`, {
      method: 'POST',
      body: JSON.stringify({ engine }),
    });
  }

  async sendWhatsAppMessage(storeId: string, to: string, message: string, orderId?: string, sessionId?: string) {
    return this.request(`/whatsapp/send/${storeId}`, {
      method: 'POST',
      body: JSON.stringify({ to, message, orderId, sessionId }),
    });
  }

  async createBroadcast(storeId: string, broadcastData: any) {
    return this.request(`/whatsapp/broadcast/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(broadcastData),
    });
  }

  async getWhatsAppLogs(storeId: string) {
    return this.request(`/whatsapp/logs/${storeId}`);
  }

  // Agent Commission Management & Reporting
  async updateStoreCommissions(storeId: string, commissions: { agentCommissionPerConfirmedOrder?: number; agentCommissionPerDeliveredOrder?: number }) {
    return this.request(`/sellers/stores/${storeId}/commissions`, {
      method: 'PUT',
      body: JSON.stringify(commissions),
    });
  }

  async getAgentCommissions(storeId: string) {
    return this.request(`/sellers/stores/${storeId}/agent-commissions`);
  }

  // Financial Reconciliation
  async uploadRemittance(storeId: string, fileData: any) {
    return this.request(`/reconciliation/upload/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  }

  async getRemittanceFiles(storeId: string) {
    return this.request(`/reconciliation/files/${storeId}`);
  }

  async getDiscrepancies(storeId: string) {
    return this.request(`/reconciliation/discrepancies/${storeId}`);
  }

  async resolveDiscrepancy(storeId: string, discrepancyId: string, resolutionData: any) {
    return this.request(`/reconciliation/discrepancies/${storeId}/${discrepancyId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(resolutionData),
    });
  }

  // Analytics
  async getMetrics(storeId: string): Promise<Metrics> {
    return this.request(`/analytics/metrics/${storeId}`);
  }

  async getAgentPerformance(storeId: string) {
    return this.request(`/analytics/agents/${storeId}`);
  }

  async getAuditLogs(storeId?: string) {
    return this.request(`/analytics/audit${storeId ? `?storeId=${storeId}` : ''}`);
  }

  // Products Catalog
  async getProducts(storeId: string, params?: { search?: string; category?: string; source?: string; inStockOnly?: boolean }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.source) q.append('source', params.source);
    if (params?.inStockOnly) q.append('inStockOnly', 'true');
    const qs = q.toString();
    return this.request(`/products/${storeId}${qs ? `?${qs}` : ''}`);
  }

  async getProduct(storeId: string, productId: string) {
    return this.request(`/products/${storeId}/${productId}`);
  }

  async createProduct(storeId: string, data: any) {
    return this.request(`/products/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(storeId: string, productId: string, data: any) {
    return this.request(`/products/${storeId}/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(storeId: string, productId: string) {
    return this.request(`/products/${storeId}/${productId}`, {
      method: 'DELETE',
    });
  }

  async importProductsCsv(storeId: string, items: any[]) {
    return this.request(`/products/${storeId}/import-csv`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  async syncProductsFromShops(storeId: string) {
    return this.request(`/products/${storeId}/sync-shops`, {
      method: 'POST',
    });
  }

  async syncProductsFromSheets(storeId: string) {
    return this.request(`/products/${storeId}/sync-sheets`, {
      method: 'POST',
    });
  }

  // --- Couriers & City-Aware Logistics ---
  async getAvailableCouriersForCity(storeId: string, city?: string) {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return this.request(`/couriers/available-for-city/${storeId}${query}`);
  }

  async listCourierCompanies() {
    return this.request('/couriers/companies');
  }

  async listCourierAccounts(storeId: string) {
    return this.request(`/couriers/accounts/${storeId}`);
  }

  async dispatchOrderWithCourier(
    storeId: string,
    orderId: string,
    data: { courierAccountId?: string; courierCompanyId?: string; shippingCost?: number }
  ) {
    return this.request(`/couriers/dispatch/${storeId}/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async lookupTracking(query?: string, storeId?: string) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (storeId) params.set('storeId', storeId);
    return this.request(`/couriers/tracking-lookup?${params.toString()}`);
  }

  // --- Internal Messaging (Strict RBAC: Sellers cannot message other sellers) ---
  async listInternalContacts() {
    return this.request('/messages/contacts');
  }

  async getInternalConversation(userId: string) {
    return this.request(`/messages/conversation/${userId}`);
  }

  async sendInternalMessage(receiverId: string, content: string) {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    });
  }

  async getUnreadInternalCount() {
    return this.request('/messages/unread-count');
  }
}

export const api = new ApiClient();
