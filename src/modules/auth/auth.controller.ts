import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service.js';
import { JwtService } from '@nestjs/jwt';

@Controller('admin')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwt: JwtService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const token = await this.authService.login(body.email, body.password);
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });
      return res.json({ message: 'Login successful' });
    } catch {
      return res
        .status(401)
        .json({ message: 'Email hoặc mật khẩu không đúng' });
    }
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res() res: Response) {
    res.clearCookie('token');
    return res.json({ message: 'Logged out' });
  }

  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const payload = this.jwt.verify<{ sub: number }>(token);

    await this.authService.changePassword(
      payload.sub,
      body.oldPassword,
      body.newPassword,
    );

    return res.json({ message: 'Password changed successfully' });
  }
}
