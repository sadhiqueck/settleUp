import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupInput } from '@settleup/shared';
import { GroupRole, ActivityType, GroupCategory } from '@prisma/client';
import type { Group } from '@prisma/client';

const GROUP_CATEGORY_MAP: Record<CreateGroupInput['category'], GroupCategory> =
  {
    TRIP: GroupCategory.TRIP,
    HOME: GroupCategory.HOME,
    OFFICE: GroupCategory.OFFICE,
    FRIENDS: GroupCategory.FRIENDS,
    OTHER: GroupCategory.OTHER,
  };

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(userId: string, data: CreateGroupInput): Promise<Group> {
    try {
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

          // 3. Log the creation activity
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

      const categoryMap: Record<string, string> = {
        TRIP: 'Travel',
        HOME: 'Home',
        OFFICE: 'Work',
        ROOMMATES: 'Home',
        FRIENDS: 'Other',
        OTHER: 'Other',
      };

      const colors = ['#FF4B4B', '#00C700', '#FF8A00', '#00E5FF', '#8B5CF6'];

      return groupMemberships.map((membership) => {
        const g = membership.group;
        const totalExpense = g.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const userBalance = g.balances.length > 0 ? g.balances[0].balance : 0;
        const lastActivityDate = g.activities.length > 0 ? g.activities[0].createdAt : g.updatedAt;
        
        // Format relative time or simple date
        const lastActivity = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(lastActivityDate));

        return {
          id: g.id,
          name: g.name,
          category: categoryMap[g.category] || 'Other',
          totalExpense: totalExpense / 100, // Convert from paise/cents to standard unit
          memberCount: g.members.length,
          members: g.members.map((m) => {
            const charCode = m.user.name.charCodeAt(0) || 0;
            return {
              name: m.user.name,
              initial: m.user.name.charAt(0).toUpperCase(),
              color: colors[charCode % colors.length],
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
}
