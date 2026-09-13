import bcrypt from 'bcryptjs';
import { AppDataSource } from '../../database/dataSource';
import { User, UserRoleEnum, UserStoreAssignment, Store } from '../../database/entities';

export class AdminService {
  private userRepo = AppDataSource.getRepository(User);
  private storeRepo = AppDataSource.getRepository(Store);
  private assignmentRepo = AppDataSource.getRepository(UserStoreAssignment);

  async listUsers(filters: { role?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.storeAssignments', 'assignment')
      .leftJoinAndSelect('assignment.store', 'store')
      .select([
        'user.id',
        'user.email',
        'user.name',
        'user.role',
        'user.isActive',
        'user.phoneNumber',
        'user.createdAt',
        'assignment.id',
        'assignment.assignedRole',
        'store.id',
        'store.name',
      ]);

    if (filters.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters.search) {
      query.andWhere('(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search)', {
        search: `%${filters.search.toLowerCase()}%`,
      });
    }

    query.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [users, total] = await query.getManyAndCount();

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(
    callerRole: UserRoleEnum,
    data: {
      email: string;
      password: string;
      name: string;
      role: UserRoleEnum;
      phoneNumber?: string;
      storeId?: string;
    }
  ) {
    // 1. Role hierarchy validation
    if (callerRole === UserRoleEnum.ADMIN) {
      if (data.role === UserRoleEnum.SUPERADMIN || data.role === UserRoleEnum.ADMIN) {
        throw {
          statusCode: 403,
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admins can only register Managers, Moderators, and Agents. SuperAdmin role required to register Admins.',
        };
      }
    } else if (callerRole !== UserRoleEnum.SUPERADMIN) {
      throw {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Only SuperAdmins and Admins can register platform staff.',
      };
    }

    // Disallow creating Seller via admin endpoint (sellers self-register via /api/auth/register)
    if (data.role === UserRoleEnum.SELLER) {
      throw {
        statusCode: 400,
        code: 'INVALID_ROLE',
        message: 'Sellers must be registered via the merchant registration endpoint (/api/auth/register).',
      };
    }

    // 2. Check duplicate email
    const existing = await this.userRepo.findOne({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'Email address already registered' };
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // 4. Save User
    const user = await this.userRepo.save(
      this.userRepo.create({
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash,
        role: data.role,
        phoneNumber: data.phoneNumber,
        isActive: true,
      })
    );

    // 5. If storeId provided, assign user to store
    let assignment: UserStoreAssignment | null = null;
    if (data.storeId) {
      const store = await this.storeRepo.findOne({ where: { id: data.storeId } });
      if (!store) {
        throw { statusCode: 404, code: 'STORE_NOT_FOUND', message: 'Assigned store not found' };
      }

      assignment = await this.assignmentRepo.save(
        this.assignmentRepo.create({
          userId: user.id,
          storeId: store.id,
          assignedRole: data.role,
        })
      );
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      assignment: assignment
        ? {
            id: assignment.id,
            storeId: assignment.storeId,
            assignedRole: assignment.assignedRole,
          }
        : null,
    };
  }

  async toggleUserStatus(callerRole: UserRoleEnum, userId: string, isActive: boolean) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    // Admins cannot deactivate SuperAdmins or other Admins
    if (callerRole === UserRoleEnum.ADMIN && (user.role === UserRoleEnum.SUPERADMIN || user.role === UserRoleEnum.ADMIN)) {
      throw {
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admins cannot modify the status of other Admins or SuperAdmins.',
      };
    }

    user.isActive = isActive;
    await this.userRepo.save(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
    };
  }

  async updateUser(
    callerRole: UserRoleEnum,
    userId: string,
    data: { name?: string; email?: string; phoneNumber?: string; role?: UserRoleEnum; password?: string; isActive?: boolean }
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };

    if (callerRole === UserRoleEnum.ADMIN && (user.role === UserRoleEnum.SUPERADMIN || user.role === UserRoleEnum.ADMIN)) {
      throw {
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admins cannot modify other Admins or SuperAdmins.',
      };
    }

    if (data.name) user.name = data.name.trim();
    if (data.email) user.email = data.email.trim().toLowerCase();
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
    if (data.role) {
      if (callerRole !== UserRoleEnum.SUPERADMIN && data.role === UserRoleEnum.SUPERADMIN) {
        throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only SuperAdmin can assign SuperAdmin role' };
      }
      user.role = data.role;
    }
    if (data.password && data.password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(data.password, salt);
    }
    if (data.isActive !== undefined) {
      user.isActive = data.isActive;
    }

    await this.userRepo.save(user);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
    };
  }
}
