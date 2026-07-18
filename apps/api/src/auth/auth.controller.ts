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
import { passwordlessStartSchema } from '@fettl/shared';
import type { PasswordlessStartInput } from '@fettl/shared';
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

  // ─── Passwordless Auth ─────────────────────────────────

  @Post('passwordless/start')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(passwordlessStartSchema))
  passwordlessStart(@Body() dto: PasswordlessStartInput) {
    return this.authService.passwordlessStart(dto);
  }

  // @Post('passwordless/verify')
  // @HttpCode(HttpStatus.OK)
  // @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  // async passwordlessVerify(
  //   @Body() dto: VerifyOtpInput,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   const { access_token, refresh_token, user } =
  //     await this.authService.verifyOtp(dto);
  //   this.setCookies(res, access_token, refresh_token);
  //   return { user };
  // }

  // @Get('magic-link/verify')
  // async magicLinkVerify(@Query('token') token: string, @Res() res: Response) {
  //   const { access_token, refresh_token } =
  //     await this.authService.verifyMagicLink(token);
  //   this.setCookies(res, access_token, refresh_token);

  //   const frontendUrl =
  //     process.env.VITE_FRONTEND_URL ?? 'http://localhost:5173';
  //   return res.redirect(`${frontendUrl}/dashboard`);
  // }

  // ─── Google OAuth ──────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  googleAuth() {
    // Intercepted by GoogleOauthGuard
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const { access_token, refresh_token } = await this.authService.googleLogin(
      req.user as import('./auth.service').GoogleProfile,
    );
    this.setCookies(res, access_token, refresh_token);

    const frontendUrl =
      process.env.VITE_FRONTEND_URL ?? 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/dashboard`);
  }

  // ─── Session Management ────────────────────────────────

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
}
