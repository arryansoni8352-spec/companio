import { Controller, Get, Put, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { IsString, IsOptional, IsArray } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() themeColor?: string;
  @IsOptional() @IsArray() interests?: string[];
}

class UpdateAiKeysDto {
  @IsOptional() @IsString() geminiKey?: string;
  @IsOptional() @IsString() openaiKey?: string;
  @IsOptional() @IsString() claudeKey?: string;
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  async search(@Query('q') query: string, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.usersService.searchUsers(query || '', skip, take);
  }

  @Get('suggested')
  @UseGuards(JwtAuthGuard)
  async getSuggested(@CurrentUser('id') userId: string) {
    return this.usersService.getSuggestedUsers(userId);
  }

  @Get('ai-keys/config')
  @UseGuards(JwtAuthGuard)
  async getAiKeys(@CurrentUser('id') userId: string) {
    return this.usersService.getAIKeys(userId);
  }

  @Put('ai-keys/config')
  @UseGuards(JwtAuthGuard)
  async updateAiKeys(@CurrentUser('id') userId: string, @Body() dto: UpdateAiKeysDto) {
    return this.usersService.updateAIKeys(userId, dto);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  async follow(@CurrentUser('id') userId: string, @Param('username') username: string) {
    return this.usersService.follow(userId, username);
  }

  @Get(':username/followers')
  async getFollowers(
    @Param('username') username: string,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    return this.usersService.getFollowers(username, skip, take);
  }

  @Get(':username/following')
  async getFollowing(
    @Param('username') username: string,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    return this.usersService.getFollowing(username, skip, take);
  }

  // :username wildcard MUST be last to avoid capturing static paths like 'ai-keys'
  @Get(':username')
  async getProfile(@Param('username') username: string, @Query('viewerId') viewerId?: string) {
    return this.usersService.getProfile(username, viewerId);
  }
}
