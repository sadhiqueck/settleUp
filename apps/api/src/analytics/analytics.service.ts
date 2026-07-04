import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(userId: string) {
    const [
      spentResult,
      paidResult,
      settledResult,
      balanceResult,
      activeGroupsCount,
      totalExpensesCount,
    ] = await Promise.all([
      this.prisma.expenseSplit.aggregate({
        _sum: { amount: true },
        where: { userId, expense: { isDeleted: false } },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { paidById: userId, isDeleted: false },
      }),
      this.prisma.settlement.aggregate({
        _sum: { amount: true },
        where: { payerId: userId, status: 'CONFIRMED' },
      }),
      this.prisma.groupMemberBalance.aggregate({
        _sum: { balance: true },
        where: { userId },
      }),
      this.prisma.groupMember.count({
        where: { userId, isActive: true },
      }),
      this.prisma.expenseSplit.count({
        where: { userId, expense: { isDeleted: false } },
      }),
    ]);

    const totalSpent = spentResult._sum.amount || 0;
    const totalPaid = paidResult._sum.amount || 0;
    const totalSettled = settledResult._sum.amount || 0;
    const netBalance = balanceResult._sum.balance || 0;

    const categoryQuery = await this.prisma.$queryRaw<
      Array<{
        category: string;
        amount: bigint | number;
        count: bigint | number;
      }>
    >`
      SELECT e.category, SUM(es.amount) as amount, COUNT(es.id) as count
      FROM expense_splits es
      JOIN expenses e ON es."expenseId" = e.id
      WHERE es."userId" = ${userId} AND e."isDeleted" = false
      GROUP BY e.category
    `;

    const categoryBreakdown = categoryQuery.map((row) => ({
      category: row.category,
      amount: Number(row.amount),
      count: Number(row.count),
      percentage: totalSpent > 0 ? (Number(row.amount) / totalSpent) * 100 : 0,
    }));

    const monthlyTrendQuery = await this.prisma.$queryRaw<
      Array<{ month: string; amount: bigint | number; count: bigint | number }>
    >`
      SELECT TO_CHAR(e.date, 'YYYY-MM') as month, SUM(es.amount) as amount, COUNT(es.id) as count
      FROM expense_splits es
      JOIN expenses e ON es."expenseId" = e.id
      WHERE es."userId" = ${userId} 
        AND e."isDeleted" = false
        AND e.date >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY TO_CHAR(e.date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    const monthlyTrend = monthlyTrendQuery.map((row) => ({
      month: row.month,
      amount: Number(row.amount),
      count: Number(row.count),
    }));

    const topGroupsQuery = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        totalspent: bigint | number;
        balance: bigint | number;
      }>
    >`
      SELECT 
        g.id, 
        g.name, 
        COALESCE(SUM(es.amount), 0) as totalspent,
        COALESCE(gmb.balance, 0) as balance
      FROM groups g
      JOIN expenses e ON e."groupId" = g.id AND e."isDeleted" = false
      JOIN expense_splits es ON es."expenseId" = e.id AND es."userId" = ${userId}
      LEFT JOIN group_member_balances gmb ON gmb."groupId" = g.id AND gmb."userId" = ${userId}
      GROUP BY g.id, g.name, gmb.balance
      ORDER BY totalspent DESC
      LIMIT 5
    `;

    const topGroups = topGroupsQuery.map((row) => ({
      id: row.id,
      name: row.name,
      totalSpent: Number(row.totalspent),
      balance: Number(row.balance),
    }));

    return {
      overview: {
        totalSpent,
        totalPaid,
        totalSettled,
        netBalance,
        activeGroups: activeGroupsCount,
        totalExpenses: totalExpensesCount,
      },
      categoryBreakdown,
      monthlyTrend,
      topGroups,
    };
  }
}
