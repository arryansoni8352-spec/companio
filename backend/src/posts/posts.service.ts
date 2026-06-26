import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    type: string;
    content?: string;
    media?: string[];
    hashtags?: string[];
    mentions?: string[];
    visibility?: string;
  }) {
    return this.prisma.post.create({
      data: {
        userId,
        type: data.type || 'photo',
        content: data.content,
        media: data.media ? JSON.stringify(data.media) : null,
        hashtags: data.hashtags ? JSON.stringify(data.hashtags) : null,
        mentions: data.mentions ? JSON.stringify(data.mentions) : null,
        visibility: data.visibility || 'public',
      },
      include: {
        user: { include: { profile: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });
  }

  async getFeed(userId: string, type = 'following', skip = 0, take = 20) {
    let whereClause: any = { deletedAt: null, archived: false };

    if (type === 'following') {
      const following = await this.prisma.follow.findMany({
        where: { followerId: userId, status: 'active' },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      followingIds.push(userId);
      whereClause.userId = { in: followingIds };
    } else if (type === 'friends') {
      // Mutual follows
      const following = await this.prisma.follow.findMany({
        where: { followerId: userId, status: 'active' },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      const mutuals = await this.prisma.follow.findMany({
        where: { followerId: { in: followingIds }, followingId: userId, status: 'active' },
        select: { followerId: true },
      });
      const mutualIds = mutuals.map((m) => m.followerId);
      mutualIds.push(userId);
      whereClause.userId = { in: mutualIds };
    } else {
      // Chronological public feed
      whereClause.visibility = 'public';
    }

    const posts = await this.prisma.post.findMany({
      where: whereClause,
      include: {
        user: { include: { profile: true } },
        _count: { select: { comments: true, likes: true, saves: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    // Check if current user liked/saved each post
    const postIds = posts.map((p) => p.id);
    const [userLikes, userSaves] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.save.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    const likedPostIds = new Set(userLikes.map((l) => l.postId));
    const savedPostIds = new Set(userSaves.map((s) => s.postId));

    return posts.map((post) => ({
      ...post,
      media: post.media ? JSON.parse(post.media) : [],
      hashtags: post.hashtags ? JSON.parse(post.hashtags) : [],
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id),
    }));
  }

  async getPost(postId: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: { include: { profile: true } },
        comments: {
          where: { deletedAt: null, parentId: null },
          include: {
            user: { include: { profile: true } },
            replies: {
              include: { user: { include: { profile: true } } },
              take: 3,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { comments: true, likes: true, saves: true } },
      },
    });

    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    let isLiked = false;
    let isSaved = false;
    if (userId) {
      const [like, save] = await Promise.all([
        this.prisma.like.findUnique({ where: { userId_postId: { userId, postId } } }),
        this.prisma.save.findUnique({ where: { userId_postId: { userId, postId } } }),
      ]);
      isLiked = !!like;
      isSaved = !!save;
    }

    return {
      ...post,
      media: post.media ? JSON.parse(post.media) : [],
      hashtags: post.hashtags ? JSON.parse(post.hashtags) : [],
      isLiked,
      isSaved,
    };
  }

  async likePost(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      await this.prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
      return { liked: false };
    }

    await this.prisma.like.create({ data: { userId, postId } });
    await this.prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
    return { liked: true };
  }

  async savePost(userId: string, postId: string) {
    const existing = await this.prisma.save.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.save.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await this.prisma.save.create({ data: { userId, postId } });
    return { saved: true };
  }

  async addComment(userId: string, postId: string, content: string, parentId?: string) {
    const comment = await this.prisma.comment.create({
      data: { userId, postId, content, parentId },
      include: { user: { include: { profile: true } } },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    return comment;
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Not your post');

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Post deleted' };
  }

  async updatePost(userId: string, postId: string, data: { content?: string }) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Not your post');

    return this.prisma.post.update({
      where: { id: postId },
      data: { content: data.content },
      include: { user: { include: { profile: true } } },
    });
  }

  async archivePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Not your post');

    return this.prisma.post.update({
      where: { id: postId },
      data: { archived: !post.archived },
    });
  }

  async getUserPosts(username: string, skip = 0, take = 20) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.post.findMany({
      where: { userId: user.id, deletedAt: null, archived: false },
      include: {
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  // Stories
  async createStory(userId: string, data: { type: string; media?: string; content?: string }) {
    return this.prisma.story.create({
      data: {
        userId,
        type: data.type,
        media: data.media,
        content: data.content,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: { user: { include: { profile: true } } },
    });
  }

  async getStories(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId, status: 'active' },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId);

    const stories = await this.prisma.story.findMany({
      where: {
        userId: { in: followingIds },
        expiresAt: { gt: new Date() },
      },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Group by user
    const grouped = new Map<string, any>();
    for (const story of stories) {
      if (!grouped.has(story.userId)) {
        grouped.set(story.userId, {
          user: story.user,
          stories: [],
        });
      }
      grouped.get(story.userId).stories.push(story);
    }

    return Array.from(grouped.values());
  }

  async getSavedPosts(userId: string, skip = 0, take = 20) {
    const saves = await this.prisma.save.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: { include: { profile: true } },
            _count: { select: { comments: true, likes: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return saves.map((s) => s.post);
  }
}
