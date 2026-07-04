import {
  Controller,
  Post,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { registerSchema, loginSchema } from '@settleup/shared';
import type { RegisterInput, LoginInput } from '@settleup/shared';
import type { Response, Request } from 'express';
import { GoogleOauthGuard } from './guards/google-oauth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookies(
    res: Response,
    access_token: string,
    refresh_token: string,
  ) {
    // 15 minutes
    res.cookie('auth_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60 * 1000,
    });

    // 7 days
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() registerDto: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token, user } =
      await this.authService.register(registerDto);
    this.setCookies(res, access_token, refresh_token);
    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() loginDto: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token, user } =
      await this.authService.login(loginDto);
    this.setCookies(res, access_token, refresh_token);
    return { user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { access_token, refresh_token, user } =
      await this.authService.refresh(refreshToken);
    this.setCookies(res, access_token, refresh_token);
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req.cookies as Record<string, string>)?.refresh_token;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
    };

    res.clearCookie('auth_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    return { message: 'Logged out successfully' };
  }

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {
    // This will be intercepted by GoogleOauthGuard
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const { access_token, refresh_token } = await this.authService.googleLogin(
      req.user as import('./auth.service').GoogleProfile,
    );
    this.setCookies(res, access_token, refresh_token);

    // Redirect to frontend dashboard
    const frontendUrl =
      process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/dashboard`);
  }
}
