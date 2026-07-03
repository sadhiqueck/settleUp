import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Lifecycle: Gateway initialized ─────────────────
  afterInit() {
    this.logger.log('💬 Chat WebSocket Gateway initialized');
  }

  // ─── Lifecycle: Client connects ─────────────────────
  async handleConnection(client: Socket) {
    try {
      // Extract the token from the handshake
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        this.logger.warn(`Rejected: No token (${client.id})`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify the JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      // Lookup the user in the database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        this.logger.warn(`Rejected: User not found (${client.id})`);
        client.emit('error', { message: 'User not found' });
        client.disconnect();
        return;
      }

      // Attach user data to the socket for all future event handlers
      client.data.user = user;

      this.logger.log(`✅ Connected: ${user.name} (${client.id})`);
    } catch {
      this.logger.warn(`Rejected: Invalid token (${client.id})`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  // ─── Lifecycle: Client disconnects ──────────────────
  handleDisconnect(client: Socket) {
    const userName = client.data?.user?.name || 'Unknown';
    this.logger.log(`❌ Disconnected: ${userName} (${client.id})`);
  }

  // ─── Test event: Ping/Pong ──────────────────────────
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    return {
      event: 'pong',
      data: {
        message: `Hello, ${user.name}! WebSocket is working! 🎉`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ─── Helper: Extract token from handshake ───────────
  private extractTokenFromHandshake(client: Socket): string | null {
    // Method 1: From the `auth` object (most reliable)
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    // Method 2: From cookies (works because frontend sends withCredentials: true)
    // The handshake is an HTTP request, so cookies are available!
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

    // Method 3: From query parameter (for testing only)
    const queryToken = client.handshake.query?.token as string;
    if (queryToken) return queryToken;

    return null;
  }
}
