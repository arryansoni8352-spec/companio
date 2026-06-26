import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async get(@CurrentUser('id') userId: string, @Query('skip') skip = 0, @Query('take') take = 30) {
    return this.notificationsService.getNotifications(userId, skip, take);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser('id') userId: string) {
    return { count: await this.notificationsService.getUnreadCount(userId) };
  }

  @Post(':id/read')
  async markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
