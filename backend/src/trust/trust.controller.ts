import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TrustService } from './trust.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('trust')
export class TrustController {
  constructor(private trustService: TrustService) {}

  @Post('report')
  @UseGuards(JwtAuthGuard)
  async report(@CurrentUser('id') userId: string, @Body() dto: { targetType: string; targetId: string; reason: string; description?: string }) {
    return this.trustService.report(userId, dto);
  }

  @Post('block/:username')
  @UseGuards(JwtAuthGuard)
  async block(@CurrentUser('id') userId: string, @Param('username') username: string) {
    return this.trustService.blockUser(userId, username);
  }

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  async getBlocked(@CurrentUser('id') userId: string) {
    return this.trustService.getBlockedUsers(userId);
  }

  @Post('review/:userId')
  @UseGuards(JwtAuthGuard)
  async review(@CurrentUser('id') reviewerId: string, @Param('userId') reviewedId: string, @Body() dto: any) {
    return this.trustService.addReview(reviewerId, reviewedId, dto);
  }

  @Get('reviews/:userId')
  async getReviews(@Param('userId') userId: string, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.trustService.getReviews(userId, skip, take);
  }

  @Get('score/:userId')
  async getTrustScore(@Param('userId') userId: string) {
    return this.trustService.getTrustScore(userId);
  }

  @Get('verifications')
  @UseGuards(JwtAuthGuard)
  async getVerifications(@CurrentUser('id') userId: string) {
    return this.trustService.getVerifications(userId);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async requestVerification(@CurrentUser('id') userId: string, @Body('type') type: string) {
    return this.trustService.requestVerification(userId, type);
  }
}
