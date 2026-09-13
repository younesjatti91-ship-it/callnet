import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../database/dataSource';
import { User, UserRoleEnum, Seller, Store, UserStoreAssignment } from '../../database/entities';
import { config } from '../../config';

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private sellerRepo = AppDataSource.getRepository(Seller);
  private storeRepo = AppDataSource.getRepository(Store);
  private assignmentRepo = AppDataSource.getRepository(UserStoreAssignment);

  async login(email: string, passwordPlain: string) {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
      relations: ['storeAssignments', 'storeAssignments.store'],
    });

    if (!user) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    if (!user.isActive) {
      throw { statusCode: 403, code: 'ACCOUNT_DISABLED', message: 'Your account has been deactivated' };
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    // Determine stores user can access with explicit role and ownership categorization
    let ownedStores: any[] = [];
    let assignedStores: any[] = [];
    let managedStores: any[] = [];
    let accessibleStores: any[] = [];

    if (user.role === UserRoleEnum.SUPERADMIN || user.role === UserRoleEnum.ADMIN) {
      // SuperAdmin & Admin have platform-level managerial oversight of all stores
      const allStores = await this.storeRepo.find();
      managedStores = allStores.map((s) => ({
        ...s,
        accessType: 'manage',
        relationship: 'platform_admin',
        description: 'Supervised platform store (Administrative Access)',
      }));
      accessibleStores = managedStores;
    } else if (user.role === UserRoleEnum.SELLER) {
      // Sellers directly own their stores
      const seller = await this.sellerRepo.findOne({
        where: { ownerUserId: user.id },
        relations: ['stores'],
      });
      ownedStores = (seller?.stores || []).map((s) => ({
        ...s,
        accessType: 'owner',
        relationship: 'owner',
        description: 'Store owned directly by merchant',
      }));
      accessibleStores = ownedStores;
    } else {
      // Agents, Managers, and Moderators are assigned to work on stores (they do NOT own them)
      assignedStores = (user.storeAssignments?.map((a) => {
        if (!a.store) return null;
        const assignedRole = a.assignedRole || user.role;
        return {
          ...a.store,
          accessType: 'assigned',
          relationship: `assigned_${assignedRole.toLowerCase()}`,
          description: `Assigned as ${assignedRole} for verification & order fulfillment`,
        };
      }).filter(Boolean) || []);
      accessibleStores = assignedStores;
    }

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      stores: accessibleStores,
      ownedStores,
      assignedStores,
      managedStores,
    };
  }

  async register(data: { email: string; password: string; name: string; companyName?: string; phone?: string }) {
    const existing = await this.userRepo.findOne({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'Email address already registered' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await this.userRepo.save(
      this.userRepo.create({
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash,
        role: UserRoleEnum.SELLER,
        phoneNumber: data.phone,
      })
    );

    // Create default Seller merchant profile & initial Store
    const seller = await this.sellerRepo.save(
      this.sellerRepo.create({
        companyName: data.companyName || `${data.name}'s E-commerce`,
        ownerUserId: user.id,
        contactPhone: data.phone,
      })
    );

    const storeSlug = `${(data.companyName || data.name).toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const store = await this.storeRepo.save(
      this.storeRepo.create({
        name: `${seller.companyName} Store`,
        slug: storeSlug,
        currency: 'USD',
        sellerId: seller.id,
      })
    );

    // Assign seller to their store
    await this.assignmentRepo.save(
      this.assignmentRepo.create({
        userId: user.id,
        storeId: store.id,
        assignedRole: 'Seller',
      })
    );

    return this.login(data.email, data.password);
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['storeAssignments', 'storeAssignments.store'],
    });
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    let ownedStores: any[] = [];
    let assignedStores: any[] = [];
    let managedStores: any[] = [];
    let accessibleStores: any[] = [];

    if (user.role === UserRoleEnum.SUPERADMIN || user.role === UserRoleEnum.ADMIN) {
      const allStores = await this.storeRepo.find();
      managedStores = allStores.map((s) => ({
        ...s,
        accessType: 'manage',
        relationship: 'platform_admin',
        description: 'Supervised platform store (Administrative Access)',
      }));
      accessibleStores = managedStores;
    } else if (user.role === UserRoleEnum.SELLER) {
      const seller = await this.sellerRepo.findOne({
        where: { ownerUserId: user.id },
        relations: ['stores'],
      });
      ownedStores = (seller?.stores || []).map((s) => ({
        ...s,
        accessType: 'owner',
        relationship: 'owner',
        description: 'Store owned directly by merchant',
      }));
      accessibleStores = ownedStores;
    } else {
      assignedStores = (user.storeAssignments?.map((a) => {
        if (!a.store) return null;
        const assignedRole = a.assignedRole || user.role;
        return {
          ...a.store,
          accessType: 'assigned',
          relationship: `assigned_${assignedRole.toLowerCase()}`,
          description: `Assigned as ${assignedRole} for verification & order fulfillment`,
        };
      }).filter(Boolean) || []);
      accessibleStores = assignedStores;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
      },
      stores: accessibleStores,
      ownedStores,
      assignedStores,
      managedStores,
    };
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; phoneNumber?: string; avatarUrl?: string; currentPassword?: string; newPassword?: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await this.userRepo.findOne({ where: { email: data.email.toLowerCase() } });
      if (existing && existing.id !== userId) {
        throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'Email address already in use' };
      }
      user.email = data.email.toLowerCase();
    }

    if (data.name) {
      user.name = data.name.trim();
    }

    if (data.phoneNumber !== undefined) {
      user.phoneNumber = data.phoneNumber;
    }

    if (data.avatarUrl !== undefined) {
      user.avatarUrl = data.avatarUrl;
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw { statusCode: 400, code: 'CURRENT_PASSWORD_REQUIRED', message: 'Current password is required to set a new password' };
      }
      const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!valid) {
        throw { statusCode: 400, code: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect' };
      }
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(data.newPassword, salt);
    }

    const saved = await this.userRepo.save(user);

    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      role: saved.role,
      phoneNumber: saved.phoneNumber,
      avatarUrl: saved.avatarUrl,
      isActive: saved.isActive,
    };
  }
}
