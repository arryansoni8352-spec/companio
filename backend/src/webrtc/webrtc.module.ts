import { Module } from '@nestjs/common';
import { WebRTCGateway } from './webrtc.gateway';
import { MatchmakingService } from './matchmaking.service';
import { PrismaModule } from '../common/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [WebRTCGateway, MatchmakingService],
})
export class WebRTCModule {}
