import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { IsString, IsOptional, IsArray } from 'class-validator';

class CreatePostDto {
  @IsString() type!: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsArray() media?: string[];
  @IsOptional() @IsArray() hashtags?: string[];
  @IsOptional() @IsArray() mentions?: string[];
  @IsOptional() @IsString() visibility?: string;
}

class CommentDto {
  @IsString() content!: string;
  @IsOptional() @IsString() parentId?: string;
}

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreatePostDto) {
    return this.postsService.create(userId, dto);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('type') type = 'following',
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    return this.postsService.getFeed(userId, type, skip, take);
  }

  @Get('stories')
  @UseGuards(JwtAuthGuard)
  async getStories(@CurrentUser('id') userId: string) {
    return this.postsService.getStories(userId);
  }

  @Post('stories')
  @UseGuards(JwtAuthGuard)
  async createStory(@CurrentUser('id') userId: string, @Body() dto: { type: string; media?: string; content?: string }) {
    return this.postsService.createStory(userId, dto);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  async getSaved(@CurrentUser('id') userId: string, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.postsService.getSavedPosts(userId, skip, take);
  }

  @Get('user/:username')
  async getUserPosts(@Param('username') username: string, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.postsService.getUserPosts(username, skip, take);
  }

  @Get(':id')
  async getPost(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.postsService.getPost(id, userId);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async like(@CurrentUser('id') userId: string, @Param('id') postId: string) {
    return this.postsService.likePost(userId, postId);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  async save(@CurrentUser('id') userId: string, @Param('id') postId: string) {
    return this.postsService.savePost(userId, postId);
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  async comment(@CurrentUser('id') userId: string, @Param('id') postId: string, @Body() dto: CommentDto) {
    return this.postsService.addComment(userId, postId, dto.content, dto.parentId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser('id') userId: string, @Param('id') postId: string, @Body() dto: { content?: string }) {
    return this.postsService.updatePost(userId, postId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser('id') userId: string, @Param('id') postId: string) {
    return this.postsService.deletePost(userId, postId);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archive(@CurrentUser('id') userId: string, @Param('id') postId: string) {
    return this.postsService.archivePost(userId, postId);
  }
}
