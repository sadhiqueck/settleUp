import { Body, Controller, Post, Get, UsePipes, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createGroupSchema } from '@settleup/shared';
import type { CreateGroupInput } from '@settleup/shared';
import type { Group } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

type CreateGroupResponse = {
  message: string;
  group: Group;
};

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(createGroupSchema))
  async createGroup(
    @Body() createGroupDto: CreateGroupInput,
    @GetUser('id') userId: string,
  ): Promise<CreateGroupResponse> {
    const createdGroup = await this.groupsService.createGroup(
      userId,
      createGroupDto,
    );

    return {
      message: 'Group successfully created',
      group: createdGroup,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserGroups(@GetUser('id') userId: string) {
    const groups = await this.groupsService.getUserGroups(userId);
    return {
      message: 'Groups successfully fetched',
      groups,
    };
  }
}
