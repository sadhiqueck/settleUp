import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/require-group-roles.decorator';
import { GroupRole } from '@prisma/client';

@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<GroupRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no specific roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // Standardize to looking for 'id' param as that's what GroupsController uses
    const groupId = request.params.id;

    if (!user || !groupId) {
      throw new ForbiddenException('Invalid user or group context');
    }

    const groupMembership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: groupId,
        },
      },
    });

    if (!groupMembership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (!requiredRoles.includes(groupMembership.role)) {
      throw new ForbiddenException(
        `Required role: ${requiredRoles.join(' or ')}. You are a ${groupMembership.role}.`,
      );
    }

    return true;
  }
}
