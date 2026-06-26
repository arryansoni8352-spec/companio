import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  async createFamily(userId: string, name: string) {
    const family = await this.prisma.family.create({
      data: {
        name,
        members: {
          create: {
            userId,
            role: 'PARENT',
          },
        },
      },
      include: { members: { include: { user: { select: { id: true, username: true } } } } },
    });

    // Link user to the family
    await this.prisma.user.update({
      where: { id: userId },
      data: { familyId: family.id },
    });

    return family;
  }

  async getFamily(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    if (!user?.familyId) throw new NotFoundException('Not part of any family');

    return this.prisma.family.findUnique({
      where: { id: user.familyId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true, profile: { select: { displayName: true, avatar: true } } },
            },
          },
        },
      },
    });
  }

  async addMember(familyId: string, targetUsername: string, role: string = 'CHILD') {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId: target.id } },
    });
    if (existing) throw new ConflictException('User is already a family member');

    await this.prisma.familyMember.create({
      data: {
        familyId,
        userId: target.id,
        role: role as any,
      },
    });

    await this.prisma.user.update({
      where: { id: target.id },
      data: { familyId },
    });

    return { message: `${targetUsername} added to family` };
  }

  async removeMember(familyId: string, userId: string) {
    await this.prisma.familyMember.deleteMany({
      where: { familyId, userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { familyId: null },
    });

    return { message: 'Member removed from family' };
  }
}
