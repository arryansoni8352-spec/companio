import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    title: string; description?: string; type: string; location?: string;
    isOnline?: boolean; meetingLink?: string; startTime: string;
    endTime?: string; maxAttendees?: number; communityId?: string;
  }) {
    return this.prisma.event.create({
      data: {
        creatorId: userId, title: data.title, description: data.description,
        type: data.type, location: data.location, isOnline: data.isOnline || false,
        meetingLink: data.meetingLink, startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        maxAttendees: data.maxAttendees, communityId: data.communityId,
      },
      include: { creator: { include: { profile: true } } },
    });
  }

  async list(filters: { type?: string; upcoming?: boolean; skip?: number; take?: number }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.upcoming) where.startTime = { gte: new Date() };

    return this.prisma.event.findMany({
      where, include: { creator: { include: { profile: true } }, _count: { select: { rsvps: true } } },
      orderBy: { startTime: 'asc' }, skip: filters.skip || 0, take: filters.take || 20,
    });
  }

  async getEvent(eventId: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: { include: { profile: true } },
        rsvps: { include: { user: { include: { profile: true } } }, take: 20 },
        _count: { select: { rsvps: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    let userRsvp = null;
    if (userId) {
      userRsvp = await this.prisma.eventRSVP.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
    }

    return { ...event, userRsvp: userRsvp?.status || null };
  }

  async rsvp(userId: string, eventId: string, status: string) {
    const existing = await this.prisma.eventRSVP.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (existing) {
      if (status === 'cancel') {
        await this.prisma.eventRSVP.delete({ where: { id: existing.id } });
        await this.prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { decrement: 1 } } });
        return { status: 'cancelled' };
      }
      return this.prisma.eventRSVP.update({ where: { id: existing.id }, data: { status } });
    }

    const rsvp = await this.prisma.eventRSVP.create({ data: { eventId, userId, status } });
    await this.prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { increment: 1 } } });
    return rsvp;
  }

  async getMyEvents(userId: string) {
    const rsvps = await this.prisma.eventRSVP.findMany({
      where: { userId },
      include: { event: { include: { creator: { include: { profile: true } } } } },
      orderBy: { event: { startTime: 'asc' } },
    });
    return rsvps.map((r) => ({ ...r.event, rsvpStatus: r.status }));
  }
}
