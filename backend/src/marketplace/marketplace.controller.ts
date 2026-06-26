import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../common/guards';

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('companions')
  getCompanions() {
    return this.marketplaceService.getCompanions();
  }

  @Get('companions/:id')
  getCompanion(@Param('id') id: string) {
    return this.marketplaceService.getCompanion(id);
  }

  @Post('book')
  bookCompanion(@Request() req: any, @Body() data: any) {
    return this.marketplaceService.bookCompanion(req.user.userId, data);
  }

  @Get('bookings')
  getBookings(@Request() req: any) {
    return this.marketplaceService.getBookings(req.user.userId);
  }

  @Put('bookings/:id/status')
  updateBookingStatus(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.marketplaceService.updateBookingStatus(req.user.userId, id, data.status);
  }
}
