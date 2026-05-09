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

const GROUP_CATEGORY_MAP: Record<CreateGroupInput['category'], GroupCategory> =
  {
    TRIP: GroupCategory.TRIP,
    HOME: GroupCategory.HOME,
    OFFICE: GroupCategory.OFFICE,
    FRIENDS: GroupCategory.FRIENDS,
    OTHER: GroupCategory.OTHER,
  };

const colors = [
  '#FF5733', // Coral
  '#33FF57', // Lime
  '#3357FF', // Blue
  '#F333FF', // Pink
  '#FF33A8', // Magenta
  '#33FFF5', // Cyan
  '#F5FF33', // Yellow
  '#FF8C33', // Orange
  '#8C33FF', // Purple
  '#33FF8C', // Spring Green
];

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

  async getGroupById(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
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
    });

    if (!group) {
      throw new Error('Group not found');
    }

    const totalExpense = group.expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    const userBalance =
      group.balances.length > 0 ? group.balances[0].balance : 0;
    const lastActivityDate =
      group.activities.length > 0
        ? group.activities[0].createdAt
        : group.updatedAt;

    // Format relative time or simple date
    const lastActivity = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(lastActivityDate));

    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };

    return {
      id: group.id,
      name: group.name,
      category: group.category,
      totalExpense: totalExpense / 100, // Convert from paise/cents to standard unit
      memberCount: group.members.length,
      members: group.members.map((m) => {
        const hash = hashString(m.user.id);
        return {
          name: m.user.name,
          initial: m.user.name.charAt(0).toUpperCase(),
          color: colors[hash % colors.length],
        };
      }),
      lastActivity,
      userBalance: userBalance / 100,
      inviteCode: group.inviteCode,
    };
  }

  async joinGroupUsingCode(userId: string, inviteCode: string) {
    //1. validate Group
    const group = await this.prisma.group.findUnique({ where: { inviteCode } });
    if (!group)
      throw new NotFoundException("Group with this code doesn't exist");

    //2. check if user is already a member
    const existingMembership = await this.prisma.groupMember.findFirst({
      where: { userId, groupId: group.id, isActive: true },
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this group.');
    }
    //3. validate member limit
    const memberCount = await this.prisma.groupMember.count({
      where: { groupId: group.id, isActive: true },
    });

    const maxMembers = this.configService.get<number>('MAX_GROUP_MEMBERS', 50);
    if (memberCount >= maxMembers) {
      throw new ForbiddenException(
        `This group has reached its maximum limit of ${maxMembers} members.`,
      );
    }
    // 4. Add User to Group (Transaction)
    const result = await this.prisma.$transaction(async (tx) => {
      // a. Add user as a member
      await tx.groupMember.create({
        data: {
          userId: userId,
          groupId: group.id,
          role: GroupRole.MEMBER,
        },
      });

      //b. Initialize user balance for this group
      await tx.groupMemberBalance.create({
        data: {
          userId: userId,
          groupId: group.id,
          balance: 0,
        },
      });

      //c. Log the "Join" activity
      await tx.activityLog.create({
        data: {
          groupId: group.id,
          userId: userId,
          type: ActivityType.GROUP_UPDATED,
          metadata: {
            action: 'joined the group',
          },
        },
      });

      return await tx.group.findUnique({
        where: { id: group.id },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          coverImage: true,
        },
      });
    });
    return {
      message: 'Successfully joined the group!',
      group: result,
    };
  }

  // async getGroupContacts(userId: string, groupId: string) {
  //   // 1. Get all group IDs the current user is in
  //   const userGroups = await this.prisma.groupMember.findMany({
  //     where: { userId, isActive: true },
  //     select: { groupId: true },
  //   });
  //   const groupIds = userGroups.map((g) => g.groupId);

  //   // 2. Find unique users in these groups, excluding the current user and those already in target group
  //   const contacts = await this.prisma.user.findMany({
  //     where: {
  //       id: { not: userId },
  //       groupMembers: {
  //         some: { groupId: { in: groupIds }, isActive: true },
  //         none: { groupId: groupId, isActive: true },
  //       },
  //     },
  //     select: {
  //       id: true,
  //       name: true,
  //       email: true,
  //       avatarUrl: true,
  //     },
  //   });

  //   return contacts;
  // }

  // async addMemberDirectly(adminId: string, groupId: string, memberId: string) {
  //   const group = await this.prisma.group.findUnique({
  //     where: { id: groupId },
  //   });
  //   if (!group) throw new NotFoundException('Group not found');

  //   const adminMembership = await this.prisma.groupMember.findUnique({
  //     where: { userId_groupId: { userId: adminId, groupId } },
  //   });
  //   if (!adminMembership)
  //     throw new ForbiddenException('You are not a member of this group');

  //   const existingMembership = await this.prisma.groupMember.findUnique({
  //     where: { userId_groupId: { userId: memberId, groupId } },
  //   });

  //   if (existingMembership && existingMembership.isActive) {
  //     throw new ConflictException('User is already a member');
  //   }

  //   const memberCount = await this.prisma.groupMember.count({
  //     where: { groupId, isActive: true },
  //   });
  //   const maxMembers = this.configService.get<number>('MAX_GROUP_MEMBERS', 50);
  //   if (memberCount >= maxMembers) {
  //     throw new ForbiddenException(
  //       `This group has reached its maximum limit of ${maxMembers} members.`,
  //     );
  //   }

  //   await this.prisma.$transaction(async (tx) => {
  //     await tx.groupMember.upsert({
  //       where: { userId_groupId: { userId: memberId, groupId } },
  //       create: {
  //         userId: memberId,
  //         groupId,
  //         role: GroupRole.MEMBER,
  //       },
  //       update: {
  //         isActive: true,
  //       },
  //     });

  //     const existingBalance = await tx.groupMemberBalance.findUnique({
  //       where: { userId_groupId: { userId: memberId, groupId } },
  //     });

  //     if (!existingBalance) {
  //       await tx.groupMemberBalance.create({
  //         data: { userId: memberId, groupId, balance: 0 },
  //       });
  //     }

  //     await tx.activityLog.create({
  //       data: {
  //         groupId,
  //         userId: memberId,
  //         type: ActivityType.GROUP_UPDATED,
  //         metadata: { action: 'was added to the group' },
  //       },
  //     });
  //   });

  //   return { message: 'Member added successfully' };
  // }

  // async addMemberByEmail(adminId: string, groupId: string, email: string) {
  //   const userToAdd = await this.prisma.user.findUnique({ where: { email } });
  //   if (!userToAdd) {
  //     throw new NotFoundException('User with this email not found');
  //   }
  //   return this.addMemberDirectly(adminId, groupId, userToAdd.id);
  // }

  // async leaveGroup(userId: string, groupId: string) {
  //   const group = await this.prisma.group.findUnique({
  //     where: { id: groupId },
  //   });
  //   if (!group) throw new NotFoundException('Group not found');

  //   const membership = await this.prisma.groupMember.findUnique({
  //     where: { userId_groupId: { userId, groupId } },
  //   });

  //   if (!membership || !membership.isActive) {
  //     throw new ConflictException('You are not an active member of this group');
  //   }

  //   const balance = await this.prisma.groupMemberBalance.findUnique({
  //     where: { userId_groupId: { userId, groupId } },
  //   });

  //   if (balance && balance.balance !== 0) {
  //     throw new ForbiddenException(
  //       'You cannot leave the group until your balances are settled (balance must be 0).',
  //     );
  //   }

  //   await this.prisma.$transaction(async (tx) => {
  //     await tx.groupMember.update({
  //       where: { userId_groupId: { userId, groupId } },
  //       data: { isActive: false },
  //     });

  //     await tx.activityLog.create({
  //       data: {
  //         groupId,
  //         userId,
  //         type: ActivityType.GROUP_UPDATED,
  //         metadata: { action: 'left the group' },
  //       },
  //     });
  //   });

  //   return { message: 'Successfully left the group' };
  // }
}
