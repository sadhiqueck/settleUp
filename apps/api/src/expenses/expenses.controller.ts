import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Delete,
  Param,
  ForbiddenException,
  NotFoundException,
  UsePipes,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createExpenseSchema, updateExpenseSchema } from '@fettl/shared';
import type { CreateExpenseInput, UpdateExpenseInput } from '@fettl/shared';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('groups/:groupId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createExpenseSchema))
  async addExpense(
    @Param('groupId') groupId: string,
    @GetUser('id') userId: string,
    @Body() body: CreateExpenseInput,
  ) {
    const result = await this.expensesService.addExpense(userId, groupId, body);

    // Broadcast to all connected group members via WebSocket
    this.chatGateway.server
      .to(`group_${groupId}`)
      .emit('expense:created', { groupId });

    return result;
  }

  @Patch(':expenseId')
  @UsePipes(new ZodValidationPipe(updateExpenseSchema))
  async updateExpense(
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
    @GetUser('id') userId: string,
    @Body() body: UpdateExpenseInput,
  ) {
    // Authorization check: Ensure user is part of the group and is the payer
    const expense = await this.expensesService.getExpenseById(expenseId);
    if (!expense || expense.groupId !== groupId) {
      throw new NotFoundException('Expense not found');
    }
    if (expense.paidBy.id !== userId) {
      throw new ForbiddenException('You can only edit your own expenses');
    }

    const result = await this.expensesService.updateExpense(expenseId, body);

    // Broadcast update to all connected group members
    this.chatGateway.server
      .to(`group_${groupId}`)
      .emit('expense:updated', { groupId });

    return result;
  }

  @Delete(':expenseId')
  async deleteExpense(
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
    @GetUser('id') userId: string,
  ) {
    // Authorization check
    const expense = await this.expensesService.getExpenseById(expenseId);
    if (!expense || expense.groupId !== groupId) {
      throw new NotFoundException('Expense not found');
    }
    if (expense.paidBy.id !== userId) {
      throw new ForbiddenException('You can only delete your own expenses');
    }

    const result = await this.expensesService.deleteExpense(expenseId);

    // Broadcast deletion to all connected group members
    this.chatGateway.server
      .to(`group_${groupId}`)
      .emit('expense:deleted', { groupId });

    return result;
  }
}
