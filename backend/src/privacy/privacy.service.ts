import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

const PRIVACY_KEYS = [
  'profile_visibility', 'companion_profile_visibility', 'last_seen',
  'online_status', 'phone_visibility', 'email_visibility', 'story_visibility',
  'post_visibility', 'message_permissions', 'tag_permissions',
  'mention_permissions', 'location_visibility',
];

@Injectable()
export class PrivacyService {
  constructor(private prisma: PrismaService) {}

  async getSettings(userId: string) {
    const settings = await this.prisma.privacySetting.findMany({ where: { userId } });
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });

    // Fill defaults
    const defaults: Record<string, string> = {
      profile_visibility: 'everyone', companion_profile_visibility: 'everyone',
      last_seen: 'everyone', online_status: 'everyone', phone_visibility: 'nobody',
      email_visibility: 'nobody', story_visibility: 'followers', post_visibility: 'public',
      message_permissions: 'everyone', tag_permissions: 'everyone',
      mention_permissions: 'everyone', location_visibility: 'nobody',
    };

    return PRIVACY_KEYS.map((key) => ({
      key,
      value: map[key] || defaults[key] || 'everyone',
      label: key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }));
  }

  async updateSetting(userId: string, key: string, value: string) {
    if (!PRIVACY_KEYS.includes(key)) {
      return { error: 'Invalid privacy setting key' };
    }

    return this.prisma.privacySetting.upsert({
      where: { userId_key: { userId, key } },
      update: { value },
      create: { userId, key, value },
    });
  }

  async updateMultipleSettings(userId: string, settings: Record<string, string>) {
    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      if (PRIVACY_KEYS.includes(key)) {
        const result = await this.prisma.privacySetting.upsert({
          where: { userId_key: { userId, key } },
          update: { value },
          create: { userId, key, value },
        });
        results.push(result);
      }
    }
    return results;
  }

  async getNotificationSettings(userId: string) {
    return this.prisma.notificationSetting.findMany({ where: { userId } });
  }

  async updateNotificationSetting(userId: string, key: string, enabled: boolean) {
    return this.prisma.notificationSetting.upsert({
      where: { userId_key: { userId, key } },
      update: { enabled },
      create: { userId, key, enabled },
    });
  }
}
