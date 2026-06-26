import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { FriendsService } from './friends.service';
import { CurrentUser } from '../common/decorators';

class FriendRequestDto {
  targetUsername: string;
  location?: string;
}

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  async requestFriend(@CurrentUser('id') requesterId: string, @Body() dto: FriendRequestDto) {
    return this.friendsService.createFriendRequest(requesterId, dto.targetUsername, dto.location);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  async getPending(@CurrentUser('id') userId: string, @Query('type') type: string = 'received') {
    // type can be 'sent' or 'received'
    return this.friendsService.getFriendRequests(userId, type as 'sent' | 'received');
  }
}
