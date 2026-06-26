import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async getCompanions() {
    return this.prisma.companionProfile.findMany({
      where: { active: true },
      include: {
        user: { select: { id: true, username: true, profile: true } },
        categories: true,
      },
    });
  }

  async getCompanion(id: string) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, profile: true } },
        categories: true,
      },
    });
    if (!companion) throw new NotFoundException('Companion not found');
    return companion;
  }

  async bookCompanion(userId: string, data: any) {
    const companion = await this.prisma.companionProfile.findUnique({ where: { id: data.companionId } });
    if (!companion) throw new NotFoundException('Companion not found');
    if (companion.userId === userId) throw new BadRequestException('Cannot book yourself');

    const durationHours = (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / (1000 * 60 * 60);
    const totalPrice = (companion.hourlyRate || 0) * durationHours;

    return this.prisma.booking.create({
      data: {
        userId,
        companionId: companion.id,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        totalPrice,
        currency: companion.currency || 'USD',
        notes: data.notes,
      },
    });
  }

  async getBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: {
        OR: [
          { userId },
          { companion: { userId } },
        ],
      },
      include: {
        user: { select: { id: true, username: true, profile: true } },
        companion: { include: { user: { select: { id: true, username: true, profile: true } } } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async updateBookingStatus(userId: string, bookingId: string, status: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId }, include: { companion: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    
    // Only companion or booker can update depending on logic (simplified for now)
    if (booking.userId !== userId && booking.companion.userId !== userId) {
      throw new BadRequestException('Not authorized to update this booking');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }
}
