import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private privacyService: PrivacyService) {}

  @Get('settings')
  async getSettings(@CurrentUser('id') userId: string) {
    return this.privacyService.getSettings(userId);
  }

  @Put('settings')
  async updateSetting(@CurrentUser('id') userId: string, @Body() dto: { key: string; value: string }) {
    return this.privacyService.updateSetting(userId, dto.key, dto.value);
  }

  @Put('settings/bulk')
  async updateMultiple(@CurrentUser('id') userId: string, @Body() dto: Record<string, string>) {
    return this.privacyService.updateMultipleSettings(userId, dto);
  }

  @Get('notifications')
  async getNotifications(@CurrentUser('id') userId: string) {
    return this.privacyService.getNotificationSettings(userId);
  }

  @Put('notifications')
  async updateNotification(@CurrentUser('id') userId: string, @Body() dto: { key: string; enabled: boolean }) {
    return this.privacyService.updateNotificationSetting(userId, dto.key, dto.enabled);
  }
}
