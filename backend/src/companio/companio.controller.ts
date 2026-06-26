import { Controller, Get, Post, Put, Body, Query, Param, UseGuards } from '@nestjs/common';
import { CompanioService } from './companio.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('companio')
export class CompanioController {
  constructor(private companioService: CompanioService) {}

  @Get('categories')
  getCategories() {
    return this.companioService.getCategories();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.companioService.getProfile(userId);
  }

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.companioService.getProfile(userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.companioService.createOrUpdateProfile(userId, dto);
  }

  @Get('discover')
  @UseGuards(JwtAuthGuard)
  async discover(
    @CurrentUser('id') userId: string,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('language') language?: string,
    @Query('verifiedOnly') verifiedOnly?: boolean,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    return this.companioService.discover(userId, {
      category, city, country, language, verifiedOnly, skip, take,
    });
  }

  @Get('matches')
  @UseGuards(JwtAuthGuard)
  async getMatches(@CurrentUser('id') userId: string) {
    return this.companioService.getMatches(userId);
  }

  @Post('matches/:id/respond')
  @UseGuards(JwtAuthGuard)
  async respondToMatch(
    @CurrentUser('id') userId: string,
    @Param('id') matchId: string,
    @Body('accept') accept: boolean,
  ) {
    return this.companioService.respondToMatch(userId, matchId, accept);
  }
}
