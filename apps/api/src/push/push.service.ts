import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as webPush from 'web-push';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT', 'mailto:admin@fettl.app');

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.logger.log('Web Push VAPID details configured');
    } else {
      this.logger.warn('Web Push VAPID keys are missing from environment variables');
    }
  }

  getVapidPublicKey() {
    return this.configService.get<string>('VAPID_PUBLIC_KEY');
  }

  async saveSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    // Save or update subscription
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
    this.logger.log(`Saved push subscription for user ${userId}`);
  }

  async sendPushToUser(userId: string, payload: any) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const promises = subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or is invalid
          this.logger.log(`Removing invalid push subscription for user ${userId}`);
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          this.logger.error(`Error sending push notification: ${error.message}`);
        }
      }
    });

    await Promise.all(promises);
  }

  async sendPushToGroupMembers(
    groupId: string,
    excludeUserId: string,
    payload: any,
  ) {
    // Find all active members in the group except the sender
    const groupMembers = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { not: excludeUserId },
        isActive: true,
      },
      select: { userId: true },
    });

    const promises = groupMembers.map((member) =>
      this.sendPushToUser(member.userId, payload),
    );

    await Promise.all(promises);
  }
}
