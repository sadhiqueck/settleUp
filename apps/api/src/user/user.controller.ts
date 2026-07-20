import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Query,
  BadRequestException,
  UsePipes,
  Header,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateProfileSchema } from '@fettl/shared';
import type { UpdateProfileInput } from '@fettl/shared';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @Header('Cache-Control', 'no-store, max-age=0')
  getProfile(@GetUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Patch('me')
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  updateProfile(
    @GetUser('id') userId: string,
    @Body() body: UpdateProfileInput,
  ) {
    return this.userService.updateProfile(userId, body);
  }

  @Get('search')
  searchUsers(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }
    return this.userService.searchUsers(query);
  }
}
