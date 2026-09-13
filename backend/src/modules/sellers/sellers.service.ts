import { AppDataSource } from '../../database/dataSource';
import { Seller, Store, User, UserStoreAssignment, UserRoleEnum, Order, OrderStatusEnum } from '../../database/entities';

export class SellersService {
  private sellerRepo = AppDataSource.getRepository(Seller);
  private storeRepo = AppDataSource.getRepository(Store);
  private assignmentRepo = AppDataSource.getRepository(UserStoreAssignment);
  private userRepo = AppDataSource.getRepository(User);

  async listSellers() {
    return this.sellerRepo.find({ relations: ['stores', 'ownerUser'] });
  }

  async getSellerById(id: string) {
    const seller = await this.sellerRepo.findOne({
      where: { id },
      relations: ['stores', 'ownerUser'],
    });
    if (!seller) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Seller not found' };
    return seller;
  }

  async getAllStores() {
    return this.storeRepo.find({
      relations: ['seller', 'seller.ownerUser', 'userAssignments', 'userAssignments.user', 'integrations', 'integrations.provider'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStoresForUser(userId: string) {
    const seller = await this.sellerRepo.findOne({ where: { ownerUserId: userId } });
    if (seller) {
      return this.storeRepo.find({
        where: { sellerId: seller.id },
        relations: ['seller', 'userAssignments', 'userAssignments.user', 'integrations', 'integrations.provider'],
        order: { createdAt: 'DESC' },
      });
    }
    const assignments = await this.assignmentRepo.find({
      where: { userId },
      relations: ['store', 'store.seller', 'store.integrations', 'store.integrations.provider'],
    });
    return assignments.map((a) => a.store).filter(Boolean);
  }

  async createStore(sellerId: string, data: { name: string; slug?: string; currency?: string; locale?: string; timezone?: string; settings?: Record<string, any> }) {
    const slug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4));
    const existingSlug = await this.storeRepo.findOne({ where: { slug } });
    if (existingSlug) {
      throw { statusCode: 409, code: 'SLUG_EXISTS', message: 'Store slug is already in use' };
    }

    const store = this.storeRepo.create({
      sellerId,
      name: data.name,
      slug,
      currency: data.currency || 'MAD',
      locale: data.locale || 'fr',
      timezone: data.timezone || 'Africa/Casablanca',
      settings: data.settings || {},
    });
    return this.storeRepo.save(store);
  }

  async createStoreForUser(userId: string, data: { name: string; slug?: string; currency?: string; locale?: string; timezone?: string; settings?: Record<string, any> }) {
    let seller = await this.sellerRepo.findOne({ where: { ownerUserId: userId } });
    if (!seller) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      seller = await this.sellerRepo.save(
        this.sellerRepo.create({
          ownerUserId: userId,
          companyName: user?.name ? `${user.name}'s Enterprise` : 'My Store Enterprise',
        })
      );
    }
    return this.createStore(seller.id, data);
  }

  async updateStore(storeId: string, data: { name?: string; slug?: string; currency?: string; locale?: string; timezone?: string; isActive?: boolean; settings?: Record<string, any> }) {
    const store = await this.getStoreById(storeId);
    if (data.name) store.name = data.name.trim();
    if (data.slug && data.slug !== store.slug) {
      const existing = await this.storeRepo.findOne({ where: { slug: data.slug } });
      if (existing && existing.id !== storeId) {
        throw { statusCode: 409, code: 'SLUG_EXISTS', message: 'Store slug already taken' };
      }
      store.slug = data.slug.trim().toLowerCase();
    }
    if (data.currency) store.currency = data.currency;
    if (data.locale) store.locale = data.locale;
    if (data.timezone) store.timezone = data.timezone;
    if (data.isActive !== undefined) store.isActive = data.isActive;
    if (data.settings) {
      store.settings = { ...(store.settings || {}), ...data.settings };
    }
    return this.storeRepo.save(store);
  }

  async deleteStore(storeId: string) {
    const store = await this.getStoreById(storeId);
    await this.storeRepo.remove(store);
    return { success: true, message: 'Store deleted successfully' };
  }

  async getStoreById(storeId: string) {
    const store = await this.storeRepo.findOne({
      where: { id: storeId },
      relations: ['seller', 'seller.ownerUser', 'userAssignments', 'userAssignments.user', 'integrations', 'integrations.provider'],
    });
    if (!store) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Store not found' };
    return store;
  }

  async updateStoreSettings(storeId: string, settings: Record<string, any>) {
    const store = await this.getStoreById(storeId);
    store.settings = { ...(store.settings || {}), ...settings };
    return this.storeRepo.save(store);
  }

  async assignUserToStore(storeId: string, userId: string, role: string = 'Agent') {
    const store = await this.getStoreById(storeId);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };

    let assignment = await this.assignmentRepo.findOne({
      where: { storeId, userId },
    });

    if (assignment) {
      assignment.assignedRole = role;
    } else {
      assignment = this.assignmentRepo.create({
        storeId,
        userId,
        assignedRole: role,
      });
    }

    return this.assignmentRepo.save(assignment);
  }

  async removeUserFromStore(storeId: string, userId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { storeId, userId },
    });
    if (!assignment) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Assignment not found' };
    await this.assignmentRepo.remove(assignment);
    return { success: true };
  }

  async getStoreAgents(storeId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { storeId },
      relations: ['user'],
    });
    return assignments.map((a) => ({
      assignmentId: a.id,
      role: a.assignedRole,
      user: {
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        phone: a.user.phoneNumber,
      },
    }));
  }

  async updateStoreCommissions(
    storeId: string,
    data: { agentCommissionPerConfirmedOrder?: number; agentCommissionPerDeliveredOrder?: number }
  ) {
    const store = await this.getStoreById(storeId);
    store.settings = {
      ...(store.settings || {}),
      agentCommissionPerConfirmedOrder: data.agentCommissionPerConfirmedOrder !== undefined
        ? data.agentCommissionPerConfirmedOrder
        : (store.settings?.agentCommissionPerConfirmedOrder ?? 5),
      agentCommissionPerDeliveredOrder: data.agentCommissionPerDeliveredOrder !== undefined
        ? data.agentCommissionPerDeliveredOrder
        : (store.settings?.agentCommissionPerDeliveredOrder ?? 15),
    };
    return this.storeRepo.save(store);
  }

  async getAgentCommissions(storeId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { storeId },
      relations: ['user'],
    });

    const orderRepo = AppDataSource.getRepository(Order);
    const store = await this.getStoreById(storeId);

    const commissionStats = await Promise.all(
      assignments.map(async (a) => {
        const agentOrders = await orderRepo.find({
          where: { storeId, assignedAgentId: a.userId },
        });

        const confirmedCount = agentOrders.filter(
          (o) => o.status === OrderStatusEnum.CONFIRMED || o.status === OrderStatusEnum.SHIPPED || o.status === OrderStatusEnum.DELIVERED
        ).length;
        const deliveredCount = agentOrders.filter((o) => o.status === OrderStatusEnum.DELIVERED).length;
        const totalCommission = agentOrders.reduce((sum, o) => sum + Number(o.agentCommissionAmount || 0), 0);

        return {
          agentId: a.user.id,
          agentName: a.user.name,
          agentEmail: a.user.email,
          role: a.assignedRole,
          ordersHandled: agentOrders.length,
          confirmedCount,
          deliveredCount,
          totalCommissionEarned: parseFloat(totalCommission.toFixed(2)),
          currency: store.currency,
        };
      })
    );

    return {
      storeId,
      commissionRates: {
        agentCommissionPerConfirmedOrder: store.settings?.agentCommissionPerConfirmedOrder ?? 5,
        agentCommissionPerDeliveredOrder: store.settings?.agentCommissionPerDeliveredOrder ?? 15,
        currency: store.currency,
      },
      agents: commissionStats,
    };
  }

  // Store Integrations Management
  async listStoreIntegrations(storeId: string) {
    const { StoreIntegrationAccount } = await import('../../database/entities');
    const integrationRepo = AppDataSource.getRepository(StoreIntegrationAccount);
    return integrationRepo.find({
      where: { storeId },
      relations: ['provider'],
      order: { createdAt: 'DESC' },
    });
  }

  async createStoreIntegration(
    storeId: string,
    data: {
      providerCode: string;
      accountName: string;
      externalShopDomain?: string;
      apiKey?: string;
      apiSecret?: string;
      apiConfig?: any;
    }
  ) {
    const { StoreIntegrationAccount, StoreIntegrationProvider, IntegrationCredential } = await import(
      '../../database/entities'
    );
    const { encryptCredential } = await import('../../utils/crypto');

    const providerRepo = AppDataSource.getRepository(StoreIntegrationProvider);
    const integrationRepo = AppDataSource.getRepository(StoreIntegrationAccount);
    const credRepo = AppDataSource.getRepository(IntegrationCredential);

    const provider = await providerRepo.findOne({ where: { code: data.providerCode } });
    if (!provider) {
      throw { statusCode: 404, code: 'PROVIDER_NOT_FOUND', message: `Integration provider '${data.providerCode}' not found` };
    }

    const account = integrationRepo.create({
      storeId,
      providerId: provider.id,
      accountName: data.accountName,
      externalShopDomain: data.externalShopDomain || '',
      status: 'connected',
      syncOrdersEnabled: true,
      lastSyncedAt: new Date(),
    });

    const savedAccount = await integrationRepo.save(account);

    if (data.apiKey || data.apiSecret || data.apiConfig) {
      const payloadToEncrypt = JSON.stringify({
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        apiConfig: data.apiConfig,
      });
      const encryptedPayload = encryptCredential(payloadToEncrypt);
      await credRepo.save(
        credRepo.create({
          entityType: 'store_integration_account',
          entityId: savedAccount.id,
          encryptedPayload,
        })
      );
    }

    return {
      ...savedAccount,
      provider,
    };
  }

  async deleteStoreIntegration(storeId: string, integrationId: string) {
    const { StoreIntegrationAccount, IntegrationCredential } = await import('../../database/entities');
    const integrationRepo = AppDataSource.getRepository(StoreIntegrationAccount);
    const credRepo = AppDataSource.getRepository(IntegrationCredential);

    const integration = await integrationRepo.findOne({
      where: { id: integrationId, storeId },
    });
    if (!integration) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Store integration account not found' };
    }

    await credRepo.delete({ entityType: 'store_integration_account', entityId: integrationId });
    await integrationRepo.remove(integration);
    return { success: true, message: 'Store integration disconnected successfully' };
  }

  async requestAgentChange(
    userId: string,
    data: { storeId: string; agentId: string; reason: string; preferredCriteria?: string; notes?: string }
  ) {
    const { AuditLog } = await import('../../database/entities');
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const ticketId = `REQ-AGT-${Date.now().toString().slice(-6)}`;

    await auditRepo.save(
      auditRepo.create({
        userId,
        storeId: data.storeId,
        action: 'SELLER_REQUESTED_AGENT_CHANGE',
        entityType: 'agent_assignment',
        entityId: data.agentId,
        details: {
          ticketId,
          reason: data.reason,
          preferredCriteria: data.preferredCriteria,
          notes: data.notes,
          requestedAt: new Date().toISOString(),
        },
      })
    );

    return {
      ticketId,
      message: 'Your agent reassignment request has been submitted to platform administrators for prompt review.',
    };
  }
}

