import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('users/me/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getAnalytics(@GetUser('id') userId: string) {
    return this.analyticsService.getAnalytics(userId);
  }
}
