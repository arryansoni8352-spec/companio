import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { IsString, IsOptional, MinLength, IsEmail, Matches } from 'class-validator';


class SignupDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9._]+$/, { message: 'Username can only contain letters, numbers, dots and underscores' })
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

class LoginDto {
  @IsString()
  login!: string;

  @IsString()
  password!: string;
}

class RefreshDto {
  @IsString()
  refreshToken!: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@CurrentUser('id') userId: string, @Req() req: any) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(userId, token);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logoutAll(@CurrentUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser('id') userId: string) {
    return this.authService.getSessions(userId);
  }

  @Get('login-history')
  @UseGuards(JwtAuthGuard)
  async getLoginHistory(@CurrentUser('id') userId: string) {
    return this.authService.getLoginHistory(userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    const { passwordHash, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }

  @Get('google')
  async googleLogin(@Res() res: any) {
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!googleClientId || googleClientId === 'placeholder') {
      return res.redirect(`${corsOrigin}/login/callback?mock=true&provider=google`);
    }

    const redirectUri = `${process.env.API_URL || 'http://localhost:3001/api'}/auth/google/callback`;
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;
    return res.redirect(googleUrl);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: any) {
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    if (!code) {
      return res.redirect(`${corsOrigin}/login?error=no_code`);
    }

    try {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${process.env.API_URL || 'http://localhost:3001/api'}/auth/google/callback`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: googleClientId!,
          client_secret: googleClientSecret!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString()
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error('Failed to obtain access token');
      }

      const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userinfo = await userinfoResponse.json();

      const result = await this.authService.handleOAuthUser('google', {
        id: userinfo.sub,
        email: userinfo.email,
        displayName: userinfo.name || userinfo.given_name,
        username: userinfo.email ? userinfo.email.split('@')[0] : `google_${userinfo.sub.substring(0, 10)}`,
      });

      return res.redirect(`${corsOrigin}/login/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
    } catch (err: any) {
      console.error(err);
      return res.redirect(`${corsOrigin}/login?error=${encodeURIComponent(err.message || 'auth_failed')}`);
    }
  }

  @Get('apple')
  async appleLogin(@Res() res: any) {
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const appleClientId = process.env.APPLE_CLIENT_ID;

    if (!appleClientId || appleClientId === 'placeholder') {
      return res.redirect(`${corsOrigin}/login/callback?mock=true&provider=apple`);
    }

    const redirectUri = `${process.env.API_URL || 'http://localhost:3001/api'}/auth/apple/callback`;
    const appleUrl = `https://appleid.apple.com/auth/authorize?client_id=${appleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code%20id_token&scope=name%20email&response_mode=form_post`;
    return res.redirect(appleUrl);
  }

  @Post('apple/callback')
  async appleCallback(@Body('code') code: string, @Body('id_token') idToken: string, @Res() res: any) {
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    try {
      if (!idToken) throw new Error('Missing id_token');
      const parts = idToken.split('.');
      if (parts.length < 2) throw new Error('Invalid JWT');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      const result = await this.authService.handleOAuthUser('apple', {
        id: payload.sub,
        email: payload.email,
        displayName: payload.email ? payload.email.split('@')[0] : 'Apple User',
        username: payload.email ? payload.email.split('@')[0] : `apple_${payload.sub.substring(0, 10)}`,
      });

      return res.redirect(`${corsOrigin}/login/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
    } catch (err: any) {
      console.error(err);
      return res.redirect(`${corsOrigin}/login?error=${encodeURIComponent(err.message || 'auth_failed')}`);
    }
  }

  @Post('mock-login')
  @HttpCode(200)
  async mockLogin(@Body('provider') provider: 'google' | 'apple') {
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    const username = `${provider}_sandbox_user_${randomId}`;
    const email = `${username}@companio.sandbox`;
    return this.authService.handleOAuthUser(provider, {
      id: `sandbox_${provider}_${randomId}`,
      email,
      displayName: `Sandbox ${provider === 'google' ? 'Google' : 'Apple'} Tester`,
      username,
    });
  }
}
