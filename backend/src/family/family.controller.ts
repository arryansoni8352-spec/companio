import { Controller, Post, Get, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { FamilyService } from './family.service';
import { CurrentUser } from '../common/decorators';
import { IsString, IsOptional } from 'class-validator';

class CreateFamilyDto {
  @IsString()
  name!: string;
}

class AddMemberDto {
  @IsString()
  username!: string;

  @IsOptional()
  @IsString()
  role?: string;
}

@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createFamily(@CurrentUser('id') userId: string, @Body() dto: CreateFamilyDto) {
    return this.familyService.createFamily(userId, dto.name);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getFamily(@CurrentUser('id') userId: string) {
    return this.familyService.getFamily(userId);
  }

  @Post('members')
  @UseGuards(JwtAuthGuard)
  async addMember(@CurrentUser() user: any, @Body() dto: AddMemberDto) {
    if (!user.familyId) {
      throw new Error('You are not part of a family. Create one first.');
    }
    return this.familyService.addMember(user.familyId, dto.username, dto.role);
  }

  @Delete('members/:userId')
  @UseGuards(JwtAuthGuard)
  async removeMember(@CurrentUser() user: any, @Param('userId') targetUserId: string) {
    if (!user.familyId) {
      throw new Error('You are not part of a family.');
    }
    return this.familyService.removeMember(user.familyId, targetUserId);
  }
}
