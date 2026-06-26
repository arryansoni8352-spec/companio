import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  providers: [FriendsService, PrismaService],
  controllers: [FriendsController],
  exports: [FriendsService],
})
export class FriendsModule {}
