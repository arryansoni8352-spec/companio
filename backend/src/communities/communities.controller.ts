import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('communities')
export class CommunitiesController {
  constructor(private communitiesService: CommunitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') userId: string, @Body() dto: { name: string; description?: string; privacy?: string; category?: string; rules?: string[] }) {
    return this.communitiesService.create(userId, dto);
  }

  @Get()
  async list(@Query('skip') skip = 0, @Query('take') take = 20, @Query('category') category?: string, @Query('search') search?: string) {
    return this.communitiesService.listCommunities(skip, take, category, search);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async getMine(@CurrentUser('id') userId: string) {
    return this.communitiesService.getMyCommunities(userId);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.communitiesService.getCommunity(id, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async join(@CurrentUser('id') userId: string, @Param('id') communityId: string) {
    return this.communitiesService.join(userId, communityId);
  }

  @Post(':id/posts')
  @UseGuards(JwtAuthGuard)
  async createPost(@CurrentUser('id') userId: string, @Param('id') communityId: string, @Body() dto: any) {
    return this.communitiesService.createPost(userId, communityId, dto);
  }

  @Get(':id/posts')
  async getPosts(@Param('id') communityId: string, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.communitiesService.getPosts(communityId, skip, take);
  }

  @Get(':id/members')
  async getMembers(@Param('id') communityId: string, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.communitiesService.getMembers(communityId, skip, take);
  }
}
