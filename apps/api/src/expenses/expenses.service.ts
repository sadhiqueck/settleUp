import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateExpenseInput, UpdateExpenseInput } from '@fettl/shared';
import { ActivityType, ExpenseCategory, SplitMethod } from '@prisma/client';
import { PushService } from '../push/push.service';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  async getExpenseById(expenseId: string) {
    return this.prisma.expense.findUnique({
      where: { id: expenseId, isDeleted: false },
      include: {
        paidBy: true,
        splits: true,
      },
    });
  }

  async addExpense(userId: string, groupId: string, data: CreateExpenseInput) {
    // Validate split amounts equal total amount
    const totalSplitAmount = data.splits.reduce(
      (sum, split) => sum + (split.amount || 0),
      0,
    );
    if (totalSplitAmount !== data.amount) {
      throw new BadRequestException(
        `Split amounts (${totalSplitAmount}) do not match total expense amount (${data.amount})`,
      );
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create the Expense
        const expense = await tx.expense.create({
          data: {
            title: data.title,
            amount: data.amount,
            paidById: data.paidById,
            groupId: groupId,
            category: data.category as ExpenseCategory,
            splitMethod: data.splitMethod as SplitMethod,
            date: new Date(data.date),
            notes: data.notes,
            receiptUrl: data.receiptUrl,
          },
        });

        // 2. Create the Splits
        const splitsData = data.splits.map((split) => ({
          expenseId: expense.id,
          userId: split.userId,
          amount: split.amount || 0, // Fallback if 0
          percentage: split.percentage,
          shares: split.shares,
        }));

        await tx.expenseSplit.createMany({
          data: splitsData,
        });

        // 3. Update GroupMemberBalances
        // For the person who paid: their balance goes UP by (Total Amount - Their Own Split)
        // For everyone else who owes: their balance goes DOWN by Their Split
        for (const split of splitsData) {
          if (split.userId === data.paidById) {
            // Payer
            const amountOwedToPayer = data.amount - split.amount;
            await tx.groupMemberBalance.upsert({
              where: { groupId_userId: { groupId, userId: split.userId } },
              create: {
                groupId,
                userId: split.userId,
                balance: amountOwedToPayer,
              },
              update: { balance: { increment: amountOwedToPayer } },
            });
          } else {
            // Borrower
            await tx.groupMemberBalance.upsert({
              where: { groupId_userId: { groupId, userId: split.userId } },
              create: { groupId, userId: split.userId, balance: -split.amount },
              update: { balance: { decrement: split.amount } },
            });
          }
        }

        // 4. Log the Activity
        await tx.activityLog.create({
          data: {
            groupId: groupId,
            userId: userId,
            expenseId: expense.id,
            type: ActivityType.EXPENSE_ADDED,
            metadata: {
              action: 'added an expense',
              expenseTitle: expense.title,
              amount: expense.amount,
            },
          },
        });

        return expense;
      });

      // 5. Send Push Notification
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });

      const payer = await this.prisma.user.findUnique({
        where: { id: data.paidById },
        select: { name: true, avatarUrl: true },
      });

      if (group && payer) {
        // Run push notification async so it doesn't block response
        void this.pushService.sendPushToGroupMembers(groupId, userId, {
          title: `New expense in ${group.name}`,
          body: `${payer.name} added "${data.title}" for ₹${(data.amount / 100).toFixed(2)}`,
          icon: payer.avatarUrl || '/icon-192x192.png',
          url: `/groups/${groupId}`,
        });
      }

      return result;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw new InternalServerErrorException('Failed to add expense');
    }
  }

  async updateExpense(expenseId: string, data: UpdateExpenseInput) {
    // Updating an expense is extremely complex in a split-payment system
    // because you have to reverse the old balances and apply the new ones.
    // For now, we will update the basic metadata of the expense.

    // TODO: Implement full balance-reversal and recalculation if amount or splits change
    if (data.amount || data.splits) {
      throw new BadRequestException(
        'Updating expense amount or splits is not fully supported yet. Please delete and recreate the expense.',
      );
    }

    try {
      return await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          title: data.title,
          category: data.category as ExpenseCategory,
          date: data.date ? new Date(data.date) : undefined,
          notes: data.notes,
          receiptUrl: data.receiptUrl,
        },
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      throw new InternalServerErrorException(
        'Failed to update expense metadata',
      );
    }
  }

  async deleteExpense(expenseId: string) {
    const expense = await this.getExpenseById(expenseId);
    if (!expense) throw new NotFoundException('Expense not found');

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Mark as deleted (Soft Delete)
        const deletedExpense = await tx.expense.update({
          where: { id: expenseId },
          data: { isDeleted: true },
        });

        // 2. Reverse the balances
        for (const split of expense.splits) {
          if (split.userId === expense.paidById) {
            // Reverse Payer
            const amountOwedToPayer = expense.amount - split.amount;
            await tx.groupMemberBalance.update({
              where: {
                groupId_userId: {
                  groupId: expense.groupId,
                  userId: split.userId,
                },
              },
              data: { balance: { decrement: amountOwedToPayer } },
            });
          } else {
            // Reverse Borrower
            await tx.groupMemberBalance.update({
              where: {
                groupId_userId: {
                  groupId: expense.groupId,
                  userId: split.userId,
                },
              },
              data: { balance: { increment: split.amount } },
            });
          }
        }

        // 3. Log the deletion
        await tx.activityLog.create({
          data: {
            groupId: expense.groupId,
            userId: expense.paidById, // Or the user who performed the action
            type: ActivityType.EXPENSE_DELETED,
            metadata: {
              action: 'deleted an expense',
              expenseTitle: expense.title,
            },
          },
        });

        return deletedExpense;
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw new InternalServerErrorException('Failed to delete expense');
    }
  }
}
