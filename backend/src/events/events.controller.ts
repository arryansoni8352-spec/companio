import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.eventsService.create(userId, dto);
  }

  @Get()
  async list(@Query('type') type?: string, @Query('upcoming') upcoming?: boolean, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.eventsService.list({ type, upcoming, skip, take });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async getMine(@CurrentUser('id') userId: string) {
    return this.eventsService.getMyEvents(userId);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.eventsService.getEvent(id, userId);
  }

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  async rsvp(@CurrentUser('id') userId: string, @Param('id') eventId: string, @Body('status') status: string) {
    return this.eventsService.rsvp(userId, eventId, status);
  }
}
