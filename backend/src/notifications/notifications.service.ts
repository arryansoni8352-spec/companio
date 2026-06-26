import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { type: string; title?: string; body: string; data?: any; actionUrl?: string }) {
    return this.prisma.notification.create({
      data: { userId, type: data.type, title: data.title, body: data.body, data: data.data ? JSON.stringify(data.data) : null, actionUrl: data.actionUrl },
    });
  }

  async getNotifications(userId: string, skip = 0, take = 30) {
    return this.prisma.notification.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, skip, take,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.update({ where: { id: notificationId, userId }, data: { read: true } });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }
}
