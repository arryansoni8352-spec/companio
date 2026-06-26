import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(data: {
    username: string;
    password: string;
    email?: string;
    phone?: string;
    displayName?: string;
  }) {
    // Check existing user
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.username === data.username) throw new ConflictException('Username already taken');
      if (data.email && existing.email === data.email) throw new ConflictException('Email already registered');
      if (data.phone && existing.phone === data.phone) throw new ConflictException('Phone already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        passwordHash,
        profile: {
          create: {
            displayName: data.displayName || data.username,
          },
        },
        trustScore: {
          create: {},
        },
      },
      include: { profile: true },
    });

    // Create default privacy settings
    const defaultSettings = [
      { key: 'profile_visibility', value: 'everyone' },
      { key: 'last_seen', value: 'everyone' },
      { key: 'online_status', value: 'everyone' },
      { key: 'phone_visibility', value: 'nobody' },
      { key: 'email_visibility', value: 'nobody' },
      { key: 'story_visibility', value: 'followers' },
      { key: 'message_permissions', value: 'everyone' },
    ];

    await this.prisma.privacySetting.createMany({
      data: defaultSettings.map((s) => ({ userId: user.id, ...s })),
    });

    const tokens = await this.generateTokens(user.id);

    // Create session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    // Log login
    await this.prisma.loginHistory.create({
      data: {
        userId: user.id,
        success: true,
        method: 'signup',
      },
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(data: { login: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: data.login },
          { email: data.login },
          { phone: data.login },
        ],
        deletedAt: null,
      },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isDisabled) {
      throw new UnauthorizedException('Account disabled');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.prisma.loginHistory.create({
        data: { userId: user.id, success: false, method: 'password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      return {
        requiresTwoFactor: true,
        tempToken: this.jwtService.sign({ sub: user.id, type: '2fa' }, { expiresIn: '5m' }),
      };
    }

    const tokens = await this.generateTokens(user.id);
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    await this.prisma.loginHistory.create({
      data: { userId: user.id, success: true, method: 'password' },
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
      const payload = this.jwtService.verify(refreshToken, { secret });

      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(payload.sub);

      // Update session
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          lastActive: new Date(),
        },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, token: string) {
    await this.prisma.session.deleteMany({
      where: { userId, token },
    });
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
    return { message: 'All sessions terminated' };
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        lastActive: true,
        createdAt: true,
      },
      orderBy: { lastActive: 'desc' },
    });
  }

  async getLoginHistory(userId: string) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all sessions except current
    await this.prisma.session.deleteMany({ where: { userId } });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, type: 'access' },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: (this.configService.get<string>('JWT_EXPIRY') || '15m') as any,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRY') || '90d') as any,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async createSession(userId: string, token: string, refreshToken: string) {
    return this.prisma.session.create({
      data: {
        userId,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}
