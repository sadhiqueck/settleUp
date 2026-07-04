import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupInput } from '@settleup/shared';
import { GroupRole, ActivityType, GroupCategory } from '@prisma/client';
import type { Group } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { decryptVpaSafe } from '../common/utils/encryption';

const GROUP_CATEGORY_MAP: Record<CreateGroupInput['category'], GroupCategory> =
  {
    TRIP: GroupCategory.TRIP,
    HOME: GroupCategory.HOME,
    OFFICE: GroupCategory.OFFICE,
    FRIENDS: GroupCategory.FRIENDS,
    OTHER: GroupCategory.OTHER,
  };

const COLORS = [
  '#FF4B4B', // Red
  '#00C700', // Primary Green
  '#FF8A00', // Orange
  '#00E5FF', // Cyan
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F59E0B', // Amber
];

const categoryMap: Record<string, string> = {
  TRIP: 'Travel',
  HOME: 'Home',
  OFFICE: 'Work',
  ROOMMATES: 'Home',
  FRIENDS: 'Friends',
  OTHER: 'Other',
};

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generates a short, human-readable alphanumeric code.
   * Excludes ambiguous characters (0, O, I, l) to prevent UX friction.
   */
  private generateRandomCode(length = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  private async generateUniqueInvitationCode(): Promise<string> {
    let isUnique = false;
    let code = '';
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      code = this.generateRandomCode();
      const existingGroup = await this.prisma.group.findUnique({
        where: { inviteCode: code },
        select: { id: true },
      });
      if (!existingGroup) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      throw new InternalServerErrorException(
        'Could not generate a unique invite code after 5 attempts.',
      );
    }

    return code;
  }

  async createGroup(userId: string, data: CreateGroupInput): Promise<Group> {
    try {
      // Generate the unique code BEFORE entering the transaction

      const uniqueInviteCode = await this.generateUniqueInvitationCode();

      // We use a transaction because we need to:
      // 1. Create the Group
      // 2. Attach the user who created it as an OWNER in GroupMember
      // 3. Initiate an ActivityLog for the group creation event

      const result = await this.prisma.$transaction(
        async (tx): Promise<Group> => {
          // 1. Create Group
          const newGroup = await tx.group.create({
            data: {
              name: data.name,
              description: data.description,
              category: GROUP_CATEGORY_MAP[data.category],
              coverImage: data.coverImage,
              inviteCode: uniqueInviteCode,
            },
          });

          // 2. Add creator as OWNER
          await tx.groupMember.create({
            data: {
              userId: userId,
              groupId: newGroup.id,
              role: GroupRole.OWNER,
            },
          });

          // 3. Initialize the owner's balance
          await tx.groupMemberBalance.create({
            data: {
              groupId: newGroup.id,
              userId: userId,
              balance: 0,
            },
          });

          // 4. Log the creation activity
          await tx.activityLog.create({
            data: {
              groupId: newGroup.id,
              userId: userId,
              type: ActivityType.GROUP_UPDATED,
              metadata: {
                action: 'created the group',
              },
            },
          });

          return newGroup;
        },
      );

      return result;
    } catch (error) {
      console.error('Error creating group transaction:', error);
      throw new InternalServerErrorException('Failed to create the group');
    }
  }

  async getUserGroups(userId: string) {
    try {
      const groupMemberships = await this.prisma.groupMember.findMany({
        where: { userId, isActive: true },
        include: {
          group: {
            include: {
              members: {
                where: { isActive: true },
                include: { user: true },
              },
              balances: {
                where: { userId },
              },
              expenses: {
                where: { isDeleted: false },
                select: { amount: true },
              },
              activities: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      // Sort in memory by last activity date descending
      groupMemberships.sort((a, b) => {
        const dateA =
          a.group.activities.length > 0
            ? new Date(a.group.activities[0].createdAt).getTime()
            : new Date(a.group.updatedAt).getTime();
        const dateB =
          b.group.activities.length > 0
            ? new Date(b.group.activities[0].createdAt).getTime()
            : new Date(b.group.updatedAt).getTime();
        return dateB - dateA;
      });

      return groupMemberships.map((membership) => {
        const g = membership.group;
        const totalExpense = g.expenses.reduce(
          (sum, exp) => sum + exp.amount,
          0,
        );
        const userBalance = g.balances.length > 0 ? g.balances[0].balance : 0;
        const lastActivityDate =
          g.activities.length > 0 ? g.activities[0].createdAt : g.updatedAt;

        // Format relative time or simple date
        const lastActivity = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
        }).format(new Date(lastActivityDate));

        return {
          id: g.id,
          name: g.name,
          category: categoryMap[g.category] || 'Other',
          totalExpense: totalExpense / 100, // Convert from paise/cents to standard unit
          memberCount: g.members.length,
          members: g.members.map((m) => {
            const hash = hashString(m.userId);
            return {
              id: m.userId,
              name: m.user.name,
              initial: m.user.name.charAt(0).toUpperCase(),
              color: COLORS[hash % COLORS.length],
              avatarUrl: m.user.avatarUrl,
            };
          }),
          lastActivity,
          userBalance: userBalance / 100,
        };
      });
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw new InternalServerErrorException('Failed to fetch user groups');
    }
  }

  async getGroupById(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, vpa: true },
            },
          },
        },
        balances: {
          include: { user: { select: { id: true, name: true, vpa: true } } },
        },
        expenses: {
          where: { isDeleted: false },
          include: {
            paidBy: { select: { id: true, name: true, avatarUrl: true } },
            splits: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { date: 'desc' },
        },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    const totalExpense = group.expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    const userBalanceRecord = group.balances.find((b) => b.userId === userId);
    const userBalance = userBalanceRecord ? userBalanceRecord.balance : 0;
    const lastActivityDate =
      group.activities.length > 0
        ? group.activities[0].createdAt
        : group.updatedAt;

    const lastActivity = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(lastActivityDate));

    // Build member name and VPA lookup
    const memberNameMap = new Map<string, string>();
    const memberVpaMap = new Map<string, string | null>();
    group.members.forEach((m) => {
      memberNameMap.set(m.userId, m.user.name);
      memberVpaMap.set(m.userId, decryptVpaSafe(m.user.vpa));
    });
    // Also include VPA from balances (in case a member left but still has balance)
    group.balances.forEach((b) => {
      if (!memberVpaMap.has(b.userId)) {
        memberVpaMap.set(b.userId, decryptVpaSafe(b.user.vpa));
      }
    });

    // --- Expenses ---
    const expenses = group.expenses.map((exp) => ({
      id: exp.id,
      title: exp.title,
      amount: exp.amount / 100,
      category: exp.category,
      splitMethod: exp.splitMethod,
      paidBy: exp.paidBy.id === userId ? 'You' : exp.paidBy.name,
      paidById: exp.paidBy.id,
      paidByAvatar: exp.paidBy.avatarUrl,
      date: exp.date.toISOString(),
      notes: exp.notes,
      splitCount: exp.splits.length,
      splits: exp.splits.map((s) => ({
        userId: s.userId,
        name: s.userId === userId ? 'You' : s.user.name,
        amount: s.amount / 100,
      })),
    }));

    // --- Balances (all members) ---
    const balances = group.balances.map((b) => ({
      memberId: b.userId,
      name:
        b.userId === userId
          ? 'You'
          : (memberNameMap.get(b.userId) ?? 'Unknown'),
      balance: b.balance / 100,
    }));

    // --- Settlement suggestions (greedy algorithm) ---
    const settlements = this.calculateSettlements(
      group.balances,
      memberNameMap,
      memberVpaMap,
      userId,
    );

    // --- Activity feed ---
    const activityTypeMap: Record<string, string> = {
      EXPENSE_ADDED: 'expense',
      EXPENSE_UPDATED: 'expense',
      EXPENSE_DELETED: 'expense',
      SETTLEMENT_CREATED: 'settlement',
      SETTLEMENT_CONFIRMED: 'settlement',
      SETTLEMENT_REJECTED: 'settlement',
      MEMBER_JOINED: 'info',
      MEMBER_LEFT: 'info',
      GROUP_UPDATED: 'info',
    };

    const activity = group.activities.map((act) => {
      const meta = act.metadata as Record<string, unknown> | null;
      return {
        id: act.id,
        type: activityTypeMap[act.type] || 'info',
        user: act.userId === userId ? 'You' : act.user.name,
        action: (meta?.action as string) || act.type,
        target: (meta?.expenseTitle as string) || undefined,
        timestamp: act.createdAt.toISOString(),
      };
    });

    return {
      id: group.id,
      name: group.name,
      category: categoryMap[group.category] || 'Other',
      totalExpense: totalExpense / 100,
      memberCount: group.members.length,
      members: group.members.map((m) => {
        const hash = hashString(m.user.id);
        return {
          id: m.userId,
          name: m.user.name,
          initial: m.user.name.charAt(0).toUpperCase(),
          color: COLORS[hash % COLORS.length],
          avatarUrl: m.user.avatarUrl,
        };
      }),
      lastActivity,
      userBalance: userBalance / 100,
      inviteCode: group.inviteCode,
      expenses,
      balances,
      settlements,
      activity,
    };
  }

  /**
   * Greedy settlement minimization: pair up largest debtor with largest creditor
   * to minimize the number of transactions needed to settle all debts.
   */
  private calculateSettlements(
    balances: { userId: string; balance: number }[],
    nameMap: Map<string, string>,
    vpaMap: Map<string, string | null>,
    currentUserId: string,
  ) {
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    for (const b of balances) {
      if (b.balance < 0) debtors.push({ userId: b.userId, amount: -b.balance });
      else if (b.balance > 0)
        creditors.push({ userId: b.userId, amount: b.balance });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements: {
      from: string;
      fromId: string;
      fromVpa: string | null;
      to: string;
      toId: string;
      toVpa: string | null;
      amount: number;
    }[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const transfer = Math.min(debtors[i].amount, creditors[j].amount);
      if (transfer > 0) {
        const fromName =
          debtors[i].userId === currentUserId
            ? 'You'
            : (nameMap.get(debtors[i].userId) ?? 'Unknown');
        const toName =
          creditors[j].userId === currentUserId
            ? 'You'
            : (nameMap.get(creditors[j].userId) ?? 'Unknown');
        settlements.push({
          from: fromName,
          fromId: debtors[i].userId,
          fromVpa: vpaMap.get(debtors[i].userId) ?? null,
          to: toName,
          toId: creditors[j].userId,
          toVpa: vpaMap.get(creditors[j].userId) ?? null,
          amount: transfer / 100,
        });
      }
      debtors[i].amount -= transfer;
      creditors[j].amount -= transfer;
      if (debtors[i].amount === 0) i++;
      if (creditors[j].amount === 0) j++;
    }

    return settlements;
  }

  private async internalAddMemberToGroup(
    userId: string,
    groupId: string,
    actionLogText: string,
  ) {
    const existingMembership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (existingMembership && existingMembership.isActive) {
      throw new ConflictException('User is already a member');
    }

    const memberCount = await this.prisma.groupMember.count({
      where: { groupId, isActive: true },
    });
    const maxMembers = this.configService.get<number>('MAX_GROUP_MEMBERS', 50);
    if (memberCount >= maxMembers) {
      throw new ForbiddenException(
        `This group has reached its maximum limit of ${maxMembers} members.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.upsert({
        where: { userId_groupId: { userId, groupId } },
        create: {
          userId,
          groupId,
          role: GroupRole.MEMBER,
        },
        update: {
          isActive: true,
        },
      });

      const existingBalance = await tx.groupMemberBalance.findUnique({
        where: { groupId_userId: { userId, groupId } },
      });

      if (!existingBalance) {
        await tx.groupMemberBalance.create({
          data: { userId, groupId, balance: 0 },
        });
      }

      await tx.activityLog.create({
        data: {
          groupId,
          userId,
          type: ActivityType.GROUP_UPDATED,
          metadata: { action: actionLogText },
        },
      });
    });
  }

  async joinGroupUsingCode(userId: string, inviteCode: string) {
    const group = await this.prisma.group.findUnique({ where: { inviteCode } });
    if (!group)
      throw new NotFoundException("Group with this code doesn't exist");

    await this.internalAddMemberToGroup(userId, group.id, 'joined the group');

    const result = await this.prisma.group.findUnique({
      where: { id: group.id },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        coverImage: true,
      },
    });

    return {
      message: 'Successfully joined the group!',
      group: result,
    };
  }

  async getGroupContacts(userId: string, groupId: string) {
    // 1. Get all group IDs the current user is in
    const userGroups = await this.prisma.groupMember.findMany({
      where: { userId, isActive: true },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);

    // 2. Find unique users in these groups, excluding the current user and those already in target group
    const contacts = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        groupMemberships: {
          some: { groupId: { in: groupIds }, isActive: true },
          none: { groupId: groupId, isActive: true },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return contacts;
  }

  async addMemberDirectly(adminId: string, groupId: string, memberId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Group not found');

    const adminMembership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: adminId, groupId } },
    });
    if (!adminMembership)
      throw new ForbiddenException('You are not a member of this group');

    await this.internalAddMemberToGroup(
      memberId,
      groupId,
      'was added to the group',
    );

    return { message: 'Member added successfully' };
  }

  async addMemberByEmail(adminId: string, groupId: string, email: string) {
    const userToAdd = await this.prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      throw new NotFoundException('User with this email not found');
    }
    return this.addMemberDirectly(adminId, groupId, userToAdd.id);
  }

  async leaveGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Group not found');

    const membership = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!membership || !membership.isActive) {
      throw new ConflictException('You are not an active member of this group');
    }

    const balance = await this.prisma.groupMemberBalance.findUnique({
      where: { groupId_userId: { userId, groupId } },
    });

    if (balance && balance.balance !== 0) {
      throw new ForbiddenException(
        'You cannot leave the group until your balances are settled (balance must be 0).',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.groupMember.update({
        where: { userId_groupId: { userId, groupId } },
        data: { isActive: false },
      });

      await tx.activityLog.create({
        data: {
          groupId,
          userId,
          type: ActivityType.GROUP_UPDATED,
          metadata: { action: 'left the group' },
        },
      });
    });

    return { message: 'Successfully left the group' };
  }
}
