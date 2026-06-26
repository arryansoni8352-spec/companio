import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async createFriendRequest(requesterId: string, targetUsername: string, location?: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) throw new NotFoundException('Target user not found');
    if (target.id === requesterId) throw new ConflictException('Cannot send request to yourself');

    // Check existing request
    const existing = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { requesterId, targetId: target.id },
          { requesterId: target.id, targetId: requesterId },
        ],
      },
    });
    if (existing) throw new ConflictException('Friend request already exists');

    return this.prisma.friendRequest.create({
      data: {
        requesterId,
        targetId: target.id,
        location,
        status: 'pending',
      },
    });
  }

  async getFriendRequests(userId: string, type: 'sent' | 'received' = 'received') {
    if (type === 'sent') {
      return this.prisma.friendRequest.findMany({
        where: { requesterId: userId },
        include: { target: true },
      });
    } else {
      return this.prisma.friendRequest.findMany({
        where: { targetId: userId },
        include: { requester: true },
      });
    }
  }
}
