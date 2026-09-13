import { AppDataSource } from '../../database/dataSource';
import { InternalMessage, User, UserRoleEnum } from '../../database/entities';

export class MessagesService {
  private messageRepo = AppDataSource.getRepository(InternalMessage);
  private userRepo = AppDataSource.getRepository(User);

  async listContacts(currentUserId: string, currentUserRole: string) {
    const currentUser = await this.userRepo.findOne({ where: { id: currentUserId } });
    if (!currentUser) throw { statusCode: 404, code: 'NOT_FOUND', message: 'User not found' };

    // Strict rule: Sellers can only message support / team (Admin, SuperAdmin, Manager, Agent, Moderator)
    // NEVER other sellers.
    const qb = this.userRepo.createQueryBuilder('u')
      .where('u.id != :currentUserId', { currentUserId })
      .andWhere('u.isActive = :isActive', { isActive: true });

    if (currentUserRole === UserRoleEnum.SELLER || currentUser.role === UserRoleEnum.SELLER) {
      qb.andWhere('u.role != :sellerRole', { sellerRole: UserRoleEnum.SELLER });
    }

    const eligibleUsers = await qb.orderBy('u.name', 'ASC').getMany();

    // Get last message and unread count for each contact
    const contactsWithMeta = await Promise.all(
      eligibleUsers.map(async (contact) => {
        const lastMessage = await this.messageRepo.findOne({
          where: [
            { senderId: currentUserId, receiverId: contact.id },
            { senderId: contact.id, receiverId: currentUserId },
          ],
          order: { createdAt: 'DESC' },
        });

        const unreadCount = await this.messageRepo.count({
          where: { senderId: contact.id, receiverId: currentUserId, isRead: false },
        });

        return {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          role: contact.role,
          avatarUrl: contact.avatarUrl,
          lastMessage: lastMessage ? lastMessage.content : null,
          lastMessageAt: lastMessage ? lastMessage.createdAt : null,
          unreadCount,
        };
      })
    );

    // Sort by recent activity
    return contactsWithMeta.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  async getConversation(currentUserId: string, otherUserId: string) {
    const currentUser = await this.userRepo.findOne({ where: { id: currentUserId } });
    const otherUser = await this.userRepo.findOne({ where: { id: otherUserId } });

    if (!currentUser || !otherUser) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'User not found' };
    }

    // RBAC check: Sellers cannot communicate with other sellers
    if (currentUser.role === UserRoleEnum.SELLER && otherUser.role === UserRoleEnum.SELLER) {
      throw {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Sellers are not permitted to message other sellers',
      };
    }

    // Fetch messages
    const messages = await this.messageRepo.find({
      where: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'receiver'],
    });

    // Mark unread messages received by current user as read
    await this.messageRepo.update(
      { senderId: otherUserId, receiverId: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return {
      contact: {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        role: otherUser.role,
        avatarUrl: otherUser.avatarUrl,
      },
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt,
        readAt: m.readAt,
        isSelf: m.senderId === currentUserId,
      })),
    };
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    if (!content || !content.trim()) {
      throw { statusCode: 400, code: 'BAD_REQUEST', message: 'Message content cannot be empty' };
    }

    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    const receiver = await this.userRepo.findOne({ where: { id: receiverId } });

    if (!sender || !receiver) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'User not found' };
    }

    // RBAC Enforcement: Sellers cannot message other sellers
    if (sender.role === UserRoleEnum.SELLER && receiver.role === UserRoleEnum.SELLER) {
      throw {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Sellers are not permitted to message other sellers',
      };
    }

    const message = this.messageRepo.create({
      senderId,
      receiverId,
      content: content.trim(),
      isRead: false,
    });

    const saved = await this.messageRepo.save(message);

    return {
      id: saved.id,
      senderId: saved.senderId,
      receiverId: saved.receiverId,
      content: saved.content,
      isRead: saved.isRead,
      createdAt: saved.createdAt,
      senderName: sender.name,
      senderRole: sender.role,
      isSelf: true,
    };
  }

  async getUnreadCount(userId: string) {
    return this.messageRepo.count({
      where: { receiverId: userId, isRead: false },
    });
  }
}
