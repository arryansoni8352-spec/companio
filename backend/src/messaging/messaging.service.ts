import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId, leftAt: null },
      include: {
        conversation: {
          include: {
            members: {
              where: { leftAt: null },
              include: { user: { include: { profile: true } } },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    });

    return memberships.map((m) => {
      const conv = m.conversation;
      const otherMembers = conv.members.filter((mem) => mem.userId !== userId);
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name || otherMembers.map((m) => m.user.profile?.displayName || m.user.username).join(', '),
        avatar: conv.avatar || (conv.type === 'private' ? otherMembers[0]?.user.profile?.avatar : null),
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          type: lastMessage.type,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
        } : null,
        members: otherMembers.map((m) => ({
          id: m.user.id,
          username: m.user.username,
          displayName: m.user.profile?.displayName,
          avatar: m.user.profile?.avatar,
        })),
        muted: m.muted,
        pinned: !!m.pinnedAt,
        unreadCount: 0, // TODO: implement with lastReadAt
      };
    });
  }

  async getOrCreatePrivateChat(userId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) throw new NotFoundException('User not found');

    // Check for existing private conversation
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'private',
        AND: [
          { members: { some: { userId, leftAt: null } } },
          { members: { some: { userId: target.id, leftAt: null } } },
        ],
      },
    });

    if (existing) return { conversationId: existing.id, created: false };

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'private',
        members: {
          create: [
            { userId },
            { userId: target.id },
          ],
        },
      },
    });

    return { conversationId: conversation.id, created: true };
  }

  async createGroupChat(userId: string, data: { name: string; memberIds: string[] }) {
    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'group',
        name: data.name,
        createdById: userId,
        members: {
          create: [
            { userId, role: 'admin' },
            ...data.memberIds.map((id) => ({ userId: id })),
          ],
        },
      },
      include: {
        members: { include: { user: { include: { profile: true } } } },
      },
    });

    return conversation;
  }

  async getMessages(userId: string, conversationId: string, skip = 0, take = 50) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership || membership.leftAt) throw new ForbiddenException('Not a member');

    const messages = await this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      include: {
        sender: { include: { profile: true } },
        replyTo: {
          include: { sender: { include: { profile: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    // Update last read
    await this.prisma.conversationMember.update({
      where: { id: membership.id },
      data: { lastReadAt: new Date() },
    });

    return messages.reverse();
  }

  async sendMessage(userId: string, conversationId: string, data: {
    content?: string;
    type?: string;
    media?: string;
    replyToId?: string;
  }) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership || membership.leftAt) throw new ForbiddenException('Not a member');

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: data.content,
        type: data.type || 'text',
        media: data.media,
        replyToId: data.replyToId,
      },
      include: {
        sender: { include: { profile: true } },
        replyTo: { include: { sender: { include: { profile: true } } } },
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async editMessage(userId: string, messageId: string, content: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Not your message');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content, edited: true },
      include: { sender: { include: { profile: true } } },
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Not your message');

    await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Message deleted' };
  }

  async pinMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { pinned: !message.pinned },
    });
  }

  async searchMessages(userId: string, query: string) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId, leftAt: null },
      select: { conversationId: true },
    });
    const convIds = memberships.map((m) => m.conversationId);

    return this.prisma.message.findMany({
      where: {
        conversationId: { in: convIds },
        content: { contains: query },
        deletedAt: null,
      },
      include: {
        sender: { include: { profile: true } },
        conversation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
