/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
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

export interface AuthSocket extends Socket {
  data: {
    user?: { id: string; name: string; email: string };
  };
}
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowed = ['http://localhost:5173'];
      if (process.env.FRONTEND_URL) allowed.push(process.env.FRONTEND_URL);

      // Allow if origin is in allowed list, or if it's undefined (e.g. Postman)
      if (
        !origin ||
        allowed.includes(origin) ||
        allowed.includes(origin.replace(/\/$/, ''))
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

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
  async handleConnection(client: AuthSocket) {
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
  handleDisconnect(client: AuthSocket) {
    const userName = client.data?.user?.name || 'Unknown';
    this.logger.log(`❌ Disconnected: ${userName} (${client.id})`);
  }

  // ─── Test event: Ping/Pong ──────────────────────────
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthSocket) {
    const user = client.data.user!;
    return {
      event: 'pong',
      data: {
        message: `Hello, ${user.name}! WebSocket is working! 🎉`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ─── Room Management ──────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody('groupId') groupId: string,
  ) {
    // Verify the user is actually a member of this group
    const isMember = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId: client.data.user!.id, groupId },
      },
    });

    if (!isMember) {
      return { status: 'error', message: 'Not a member of this group' };
    }

    // Join the Socket.io room specific to this group
    const roomName = `group_${groupId}`;
    void client.join(roomName);
    this.logger.log(`${client.data.user!.name} joined room: ${roomName}`);

    // Fetch recent 50 messages
    const history = await this.prisma.chatMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Send history to the client who just joined
    client.emit('chatHistory', history.reverse());

    return { status: 'success', room: roomName };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody('groupId') groupId: string,
  ) {
    const roomName = `group_${groupId}`;
    void client.leave(roomName);
    this.logger.log(`${client.data.user!.name} left room: ${roomName}`);
  }

  // ─── Messaging ────────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    payload: { groupId: string; content: string; imageUrl?: string },
  ) {
    const user = client.data.user!;

    // 1. Save message to database
    const message = await this.prisma.chatMessage.create({
      data: {
        groupId: payload.groupId,
        userId: user.id,
        content: payload.content,
        imageUrl: payload.imageUrl,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // 2. Broadcast to everyone in the room (including the sender)
    const roomName = `group_${payload.groupId}`;
    this.server.to(roomName).emit('newMessage', message);

    return { status: 'delivered' };
  }

  // ─── Helper: Extract token from handshake ───────────
  private extractTokenFromHandshake(client: AuthSocket): string | null {
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
