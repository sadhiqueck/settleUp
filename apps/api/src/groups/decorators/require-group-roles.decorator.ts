import { SetMetadata } from '@nestjs/common';
import { GroupRole } from '@prisma/client';

export const ROLES_KEY = 'groupRoles';
export const RequireGroupRoles = (...roles: GroupRole[]) => SetMetadata(ROLES_KEY, roles);
