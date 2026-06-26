import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TrustService {
  constructor(private prisma: PrismaService) {}

  async report(reporterId: string, data: { targetType: string; targetId: string; reason: string; description?: string }) {
    return this.prisma.report.create({
      data: { reporterId, targetType: data.targetType, targetId: data.targetId, reason: data.reason, description: data.description },
    });
  }

  async blockUser(blockerId: string, blockedUsername: string) {
    const blocked = await this.prisma.user.findUnique({ where: { username: blockedUsername } });
    if (!blocked) throw new NotFoundException('User not found');
    if (blocked.id === blockerId) throw new BadRequestException('Cannot block yourself');

    const existing = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId: blocked.id } },
    });
    if (existing) {
      await this.prisma.block.delete({ where: { id: existing.id } });
      return { blocked: false };
    }

    await this.prisma.block.create({ data: { blockerId, blockedId: blocked.id } });
    // Also unfollow both directions
    await this.prisma.follow.deleteMany({
      where: { OR: [{ followerId: blockerId, followingId: blocked.id }, { followerId: blocked.id, followingId: blockerId }] },
    });
    return { blocked: true };
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId: userId },
      include: { blocked: { include: { profile: true } } },
    });
    return blocks.map((b) => ({ id: b.blocked.id, username: b.blocked.username, displayName: b.blocked.profile?.displayName, avatar: b.blocked.profile?.avatar, blockedAt: b.createdAt }));
  }

  async addReview(reviewerId: string, reviewedId: string, data: {
    rating: number; trustRating?: number; reliabilityRating?: number;
    communicationRating?: number; content?: string; category?: string;
  }) {
    if (reviewerId === reviewedId) throw new BadRequestException('Cannot review yourself');

    const review = await this.prisma.review.create({
      data: { reviewerId, reviewedId, ...data },
      include: { reviewer: { include: { profile: true } } },
    });

    // Update trust score
    await this.recalculateTrustScore(reviewedId);
    return review;
  }

  async getReviews(userId: string, skip = 0, take = 20) {
    return this.prisma.review.findMany({
      where: { reviewedId: userId },
      include: { reviewer: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take,
    });
  }

  async getTrustScore(userId: string) {
    return this.prisma.trustScore.findUnique({ where: { userId } });
  }

  async getVerifications(userId: string) {
    return this.prisma.verification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async requestVerification(userId: string, type: string) {
    return this.prisma.verification.create({
      data: { userId, type, status: 'pending' },
    });
  }

  private async recalculateTrustScore(userId: string) {
    const reviews = await this.prisma.review.findMany({ where: { reviewedId: userId } });
    if (reviews.length === 0) return;

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const overall = avg(reviews.map((r) => r.rating));
    const communication = avg(reviews.filter((r) => r.communicationRating).map((r) => r.communicationRating!));
    const reliability = avg(reviews.filter((r) => r.reliabilityRating).map((r) => r.reliabilityRating!));

    await this.prisma.trustScore.upsert({
      where: { userId },
      update: { overall, communication, reliability, totalReviews: reviews.length },
      create: { userId, overall, communication, reliability, totalReviews: reviews.length },
    });
  }
}
