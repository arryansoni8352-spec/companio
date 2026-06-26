import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get('conversations')
  async getConversations(@CurrentUser('id') userId: string) {
    return this.messagingService.getConversations(userId);
  }

  @Post('conversations/private')
  async getOrCreatePrivate(@CurrentUser('id') userId: string, @Body('username') username: string) {
    return this.messagingService.getOrCreatePrivateChat(userId, username);
  }

  @Post('conversations/group')
  async createGroup(@CurrentUser('id') userId: string, @Body() dto: { name: string; memberIds: string[] }) {
    return this.messagingService.createGroupChat(userId, dto);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 50,
  ) {
    return this.messagingService.getMessages(userId, conversationId, skip, take);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Body() dto: { content?: string; type?: string; media?: string; replyToId?: string },
  ) {
    return this.messagingService.sendMessage(userId, conversationId, dto);
  }

  @Put('messages/:id')
  async editMessage(@CurrentUser('id') userId: string, @Param('id') messageId: string, @Body('content') content: string) {
    return this.messagingService.editMessage(userId, messageId, content);
  }

  @Delete('messages/:id')
  async deleteMessage(@CurrentUser('id') userId: string, @Param('id') messageId: string) {
    return this.messagingService.deleteMessage(userId, messageId);
  }

  @Post('messages/:id/pin')
  async pinMessage(@CurrentUser('id') userId: string, @Param('id') messageId: string) {
    return this.messagingService.pinMessage(userId, messageId);
  }

  @Get('search')
  async searchMessages(@CurrentUser('id') userId: string, @Query('q') query: string) {
    return this.messagingService.searchMessages(userId, query);
  }
}
