import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSettlementInput } from '@fettl/shared';
import { ActivityType, SettlementStatus } from '@prisma/client';

@Injectable()
export class SettlementsService {
  constructor(private prisma: PrismaService) {}

  async createSettlement(
    userId: string,
    groupId: string,
    data: CreateSettlementInput,
  ) {
    if (data.payerId === data.receiverId) {
      throw new BadRequestException('Payer and receiver cannot be the same');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Create the Settlement record as CONFIRMED (manual payment)
        const settlement = await tx.settlement.create({
          data: {
            groupId,
            payerId: data.payerId,
            receiverId: data.receiverId,
            amount: data.amount,
            status: SettlementStatus.CONFIRMED,
            note: data.note,
          },
          include: {
            payer: { select: { id: true, name: true } },
            receiver: { select: { id: true, name: true } },
          },
        });

        // 2. Update GroupMemberBalances
        // The payer had a negative balance (owed money), so increment it
        await tx.groupMemberBalance.upsert({
          where: {
            groupId_userId: { groupId, userId: data.payerId },
          },
          create: {
            groupId,
            userId: data.payerId,
            balance: data.amount,
          },
          update: {
            balance: { increment: data.amount },
          },
        });

        // The receiver had a positive balance (was owed money), so decrement it
        await tx.groupMemberBalance.upsert({
          where: {
            groupId_userId: { groupId, userId: data.receiverId },
          },
          create: {
            groupId,
            userId: data.receiverId,
            balance: -data.amount,
          },
          update: {
            balance: { decrement: data.amount },
          },
        });

        // 3. Log the activity
        await tx.activityLog.create({
          data: {
            groupId,
            userId,
            type: ActivityType.SETTLEMENT_CONFIRMED,
            metadata: {
              action: 'recorded a payment',
              payerName: settlement.payer.name,
              receiverName: settlement.receiver.name,
              amount: settlement.amount,
              note: data.note || null,
            },
          },
        });

        return settlement;
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error creating settlement:', error);
      throw new InternalServerErrorException('Failed to record settlement');
    }
  }
}
