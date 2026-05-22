import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import type { RegisterInput, LoginInput } from '@settleup/shared';
import type { Profile } from 'passport-google-oauth20';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        passwordHash,
      },
    });

    return this.generateTokens(user);
  }

  async login(loginDto: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async googleLogin(profile: Profile) {
    if (!profile) {
      throw new UnauthorizedException('No user from google');
    }

    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;
    const googleId = profile.id;
    const avatarUrl = profile.photos?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException('Google profile missing email');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          googleId,
          avatarUrl,
          isEmailVerified: true,
        },
      });
    } else if (!user.googleId) {
      // Update existing user with googleId
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: user.avatarUrl || avatarUrl,
          isEmailVerified: true,
        },
      });
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('No refresh token provided');

    const hashedToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const savedToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (
      !savedToken ||
      savedToken.isRevoked ||
      savedToken.expiresAt < new Date()
    ) {
      if (savedToken) {
        // Token reuse detected or expired, revoke it
        await this.prisma.refreshToken.update({
          where: { id: savedToken.id },
          data: { isRevoked: true },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke the old token (Token Rotation)
    await this.prisma.refreshToken.delete({
      where: { id: savedToken.id },
    });

    return this.generateTokens(savedToken.user);
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      const hashedToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      await this.prisma.refreshToken.deleteMany({
        where: { token: hashedToken },
      });
    }
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    name: string;
    vpa?: string | null;
  }) {
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    const refresh_token = crypto.randomBytes(64).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(refresh_token)
      .digest('hex');

    // Set expiration to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        vpa: user.vpa ?? null,
      },
    };
  }
}
