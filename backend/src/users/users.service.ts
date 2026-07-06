import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(username: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        trustScore: true,
        _count: {
          select: {
            posts: { where: { deletedAt: null, archived: false } },
            followers: { where: { status: 'active' } },
            following: { where: { status: 'active' } },
          },
        },
      },
    });

    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    let isFollowing = false;
    let isFollowedBy = false;

    if (currentUserId && currentUserId !== user.id) {
      const [followStatus, followedByStatus] = await Promise.all([
        this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
        }),
        this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: user.id, followingId: currentUserId } },
        }),
      ]);
      isFollowing = !!followStatus;
      isFollowedBy = !!followedByStatus;
    }

    const { passwordHash, twoFactorSecret, ...sanitized } = user;
    return {
      ...sanitized,
      isFollowing,
      isFollowedBy,
      postsCount: user._count.posts,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    };
  }

  async updateProfile(userId: string, data: {
    displayName?: string;
    bio?: string;
    website?: string;
    location?: string;
    themeColor?: string;
    interests?: string[];
  }) {
    return this.prisma.profile.update({
      where: { userId },
      data: {
        displayName: data.displayName,
        bio: data.bio,
        website: data.website,
        location: data.location,
        themeColor: data.themeColor,
        interests: data.interests ? JSON.stringify(data.interests) : undefined,
      },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.profile.update({
      where: { userId },
      data: { avatar: avatarUrl },
    });
  }

  async updateCover(userId: string, coverUrl: string) {
    return this.prisma.profile.update({
      where: { userId },
      data: { coverImage: coverUrl },
    });
  }

  async follow(followerId: string, username: string) {
    const target = await this.prisma.user.findUnique({ where: { username } });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === followerId) throw new BadRequestException('Cannot follow yourself');

    // Check block
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: followerId, blockedId: target.id },
          { blockerId: target.id, blockedId: followerId },
        ],
      },
    });
    if (blocked) throw new BadRequestException('Cannot follow this user');

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });

    if (existing) {
      // Unfollow
      await this.prisma.follow.delete({ where: { id: existing.id } });
      return { following: false };
    }

    // Follow
    await this.prisma.follow.create({
      data: { followerId, followingId: target.id, status: 'active' },
    });

    return { following: true };
  }

  async getFollowers(username: string, skip = 0, take = 20) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const followers = await this.prisma.follow.findMany({
      where: { followingId: user.id, status: 'active' },
      include: {
        follower: {
          include: { profile: true },
        },
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return followers.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      displayName: f.follower.profile?.displayName,
      avatar: f.follower.profile?.avatar,
      followedAt: f.createdAt,
    }));
  }

  async getFollowing(username: string, skip = 0, take = 20) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const following = await this.prisma.follow.findMany({
      where: { followerId: user.id, status: 'active' },
      include: {
        following: {
          include: { profile: true },
        },
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return following.map((f) => ({
      id: f.following.id,
      username: f.following.username,
      displayName: f.following.profile?.displayName,
      avatar: f.following.profile?.avatar,
      followedAt: f.createdAt,
    }));
  }

  async searchUsers(query: string, skip = 0, take = 20) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { profile: { displayName: { contains: query } } },
        ],
        deletedAt: null,
      },
      include: { profile: true },
      skip,
      take,
    });
  }

  async getSuggestedUsers(userId: string, take = 10) {
    // Get user's following list
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId);

    // Suggest users not yet followed
    return this.prisma.user.findMany({
      where: {
        id: { notIn: followingIds },
        deletedAt: null,
      },
      include: { profile: true, trustScore: true },
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
