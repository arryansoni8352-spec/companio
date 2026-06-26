import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalPosts, totalCommunities, totalEvents, pendingReports, activeChats] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.community.count({ where: { deletedAt: null } }),
      this.prisma.event.count(),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.conversation.count(),
    ]);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [newUsersToday, newPostsToday] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.post.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

    return {
      totalUsers, totalPosts, totalCommunities, totalEvents,
      pendingReports, activeChats, newUsersToday, newPostsToday,
    };
  }

  async getUsers(skip = 0, take = 20, search?: string, role?: string) {
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { profile: { displayName: { contains: search } } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { profile: true, trustScore: true, _count: { select: { posts: true, followers: true } } },
        skip, take, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users: users.map((u) => { const { passwordHash, twoFactorSecret, ...rest } = u; return rest; }), total };
  }

  async getReports(status?: string, skip = 0, take = 20) {
    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: { include: { profile: true } },
          target: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' }, skip, take,
      }),
      this.prisma.report.count({ where }),
    ]);
    return { reports, total };
  }

  async resolveReport(reportId: string, reviewerId: string, resolution: string, status: string) {
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status, resolution, reviewedBy: reviewerId, reviewedAt: new Date() },
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { role } });
  }

  async suspendUser(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
  }

  async unsuspendUser(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { deletedAt: null } });
  }

  async approveVerification(verificationId: string) {
    return this.prisma.verification.update({
      where: { id: verificationId },
      data: { status: 'verified', verifiedAt: new Date() },
    });
  }
}
