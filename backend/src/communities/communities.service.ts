import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { name: string; description?: string; privacy?: string; category?: string; rules?: string[] }) {
    const community = await this.prisma.community.create({
      data: {
        name: data.name,
        description: data.description,
        privacy: data.privacy || 'public',
        category: data.category,
        rules: data.rules ? JSON.stringify(data.rules) : null,
        ownerId: userId,
        memberCount: 1,
        members: { create: { userId, role: 'owner' } },
      },
      include: { owner: { include: { profile: true } }, _count: { select: { members: true } } },
    });
    return community;
  }

  async getCommunity(communityId: string, userId?: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: {
        owner: { include: { profile: true } },
        _count: { select: { members: true, posts: true, events: true } },
      },
    });
    if (!community || community.deletedAt) throw new NotFoundException('Community not found');

    let membership = null;
    if (userId) {
      membership = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } },
      });
    }

    return {
      ...community,
      rules: community.rules ? JSON.parse(community.rules) : [],
      isMember: !!membership && !membership.leftAt,
      role: membership?.role,
    };
  }

  async listCommunities(skip = 0, take = 20, category?: string, search?: string) {
    const where: any = { deletedAt: null, privacy: 'public' };
    if (category) where.category = category;
    if (search) where.name = { contains: search };

    return this.prisma.community.findMany({
      where,
      include: { _count: { select: { members: true } } },
      orderBy: { memberCount: 'desc' },
      skip,
      take,
    });
  }

  async join(userId: string, communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });

    if (existing && !existing.leftAt) {
      // Leave
      await this.prisma.communityMember.update({ where: { id: existing.id }, data: { leftAt: new Date() } });
      await this.prisma.community.update({ where: { id: communityId }, data: { memberCount: { decrement: 1 } } });
      return { joined: false };
    }

    if (existing) {
      await this.prisma.communityMember.update({ where: { id: existing.id }, data: { leftAt: null } });
    } else {
      await this.prisma.communityMember.create({ data: { communityId, userId } });
    }
    await this.prisma.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } });
    return { joined: true };
  }

  async createPost(userId: string, communityId: string, data: { title?: string; content: string; type?: string; media?: string }) {
    const membership = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!membership || membership.leftAt) throw new ForbiddenException('Not a member');

    const post = await this.prisma.communityPost.create({
      data: { communityId, authorId: userId, title: data.title, content: data.content, type: data.type || 'discussion', media: data.media },
    });
    await this.prisma.community.update({ where: { id: communityId }, data: { postCount: { increment: 1 } } });
    return post;
  }

  async getPosts(communityId: string, skip = 0, take = 20) {
    return this.prisma.communityPost.findMany({
      where: { communityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getMembers(communityId: string, skip = 0, take = 20) {
    return this.prisma.communityMember.findMany({
      where: { communityId, leftAt: null },
      include: { user: { include: { profile: true } } },
      orderBy: { joinedAt: 'asc' },
      skip,
      take,
    });
  }

  async getMyCommunities(userId: string) {
    const memberships = await this.prisma.communityMember.findMany({
      where: { userId, leftAt: null },
      include: { community: { include: { _count: { select: { members: true } } } } },
    });
    return memberships.map((m) => m.community);
  }
}
