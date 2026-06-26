import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, AdminGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() { return this.adminService.getDashboardStats(); }

  @Get('users')
  async getUsers(@Query('skip') skip = 0, @Query('take') take = 20, @Query('search') search?: string, @Query('role') role?: string) {
    return this.adminService.getUsers(skip, take, search, role);
  }

  @Put('users/:id/role')
  async updateRole(@Param('id') userId: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(userId, role);
  }

  @Post('users/:id/suspend')
  async suspend(@Param('id') userId: string) { return this.adminService.suspendUser(userId); }

  @Post('users/:id/unsuspend')
  async unsuspend(@Param('id') userId: string) { return this.adminService.unsuspendUser(userId); }

  @Get('reports')
  async getReports(@Query('status') status?: string, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.adminService.getReports(status, skip, take);
  }

  @Post('reports/:id/resolve')
  async resolveReport(@Param('id') reportId: string, @CurrentUser('id') reviewerId: string, @Body() dto: { resolution: string; status: string }) {
    return this.adminService.resolveReport(reportId, reviewerId, dto.resolution, dto.status);
  }

  @Post('verifications/:id/approve')
  async approveVerification(@Param('id') id: string) {
    return this.adminService.approveVerification(id);
  }
}
