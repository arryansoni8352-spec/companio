import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { MessagingModule } from './messaging/messaging.module';
import { CompanioModule } from './companio/companio.module';
import { CommunitiesModule } from './communities/communities.module';
import { EventsModule } from './events/events.module';
import { TrustModule } from './trust/trust.module';
import { PrivacyModule } from './privacy/privacy.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AICompanionModule } from './ai-companion/ai-companion.module';
import { WebRTCModule } from './webrtc/webrtc.module';
import { FamilyModule } from './family/family.module';
import { FriendsModule } from './friends/friends.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    MessagingModule,
    CompanioModule,
    CommunitiesModule,
    EventsModule,
    TrustModule,
    PrivacyModule,
    AdminModule,
    NotificationsModule,
    StorageModule,
    RealtimeModule,
    MarketplaceModule,
    AICompanionModule,
    WebRTCModule,
    FriendsModule,
  ],
})
export class AppModule {}
