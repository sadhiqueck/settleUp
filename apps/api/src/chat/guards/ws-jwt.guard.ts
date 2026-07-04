/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthSocket } from '../chat.gateway';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthSocket = context.switchToWs().getClient();

    // ─── 1. Already Authenticated ─────────────────────────────────
    if (client.data?.user) {
      return true;
    }

    // ─── 2. Race Condition Fallback ───────────────────────────────
    // Because handleConnection is async, a client might emit an event
    // immediately upon connecting, before handleConnection finishes.
    // If client.data.user is missing, we authenticate them right here.
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      this.logger.warn(`Unauthenticated event attempt (${client.id})`);
      throw new WsException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        throw new WsException('User not found');
      }

      // Cache it so future events skip this DB/crypto overhead
      client.data.user = user;
      return true;
    } catch {
      this.logger.warn(`Invalid token during event (${client.id})`);
      throw new WsException('Invalid or expired token');
    }
  }

  /**
   * Helper to extract the token, identical to the Gateway's method.
   * Supports auth object, HTTP cookies, and query params.
   */
  private extractTokenFromHandshake(client: AuthSocket): string | null {
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    const cookies = client.handshake.headers?.cookie;
    if (cookies) {
      const authCookie = cookies
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('auth_token='));
      if (authCookie) {
        return authCookie.split('=')[1];
      }
    }

    const queryToken = client.handshake.query?.token as string;
    if (queryToken) return queryToken;

    return null;
  }
}
