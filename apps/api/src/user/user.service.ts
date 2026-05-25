import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encryptVpa, decryptVpaSafe } from '../common/utils/encryption';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        vpa: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Decrypt VPA before returning to the client
    return { ...user, vpa: decryptVpaSafe(user.vpa) };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string; vpa?: string },
  ) {
    // Encrypt VPA before storing in the database
    const dbData = {
      ...data,
      ...(data.vpa !== undefined ? { vpa: encryptVpa(data.vpa) } : {}),
    };

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dbData,
      select: {
        id: true,
        email: true,
        name: true,
        vpa: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Decrypt VPA before returning to the client
    return { ...user, vpa: decryptVpaSafe(user.vpa) };
  }

  async searchUsers(query: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
      take: 10,
    });
  }
}
