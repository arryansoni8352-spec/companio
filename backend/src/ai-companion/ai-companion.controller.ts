import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AICompanionService } from './ai-companion.service';
import { JwtAuthGuard } from '../common/guards';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AICompanionController {
  constructor(private readonly aiService: AICompanionService) {}

  @Get('companions')
  getCompanions() {
    return this.aiService.getAICompanions();
  }

  @Get('companions/:id')
  getCompanion(@Param('id') id: string) {
    return this.aiService.getAICompanion(id);
  }

  @Get('conversations')
  getConversations(@Request() req: any) {
    return this.aiService.getConversations(req.user.userId);
  }

  @Get('conversations/:aiId')
  getConversation(@Request() req: any, @Param('aiId') aiId: string) {
    return this.aiService.getConversation(req.user.userId, aiId);
  }

  @Post('conversations/:aiId/messages')
  sendMessage(@Request() req: any, @Param('aiId') aiId: string, @Body('content') content: string) {
    return this.aiService.sendMessage(req.user.userId, aiId, content);
  }

  @Post('companions')
  createCompanion(@Body() data: any) {
    return this.aiService.createAICompanion(data);
  }
}
