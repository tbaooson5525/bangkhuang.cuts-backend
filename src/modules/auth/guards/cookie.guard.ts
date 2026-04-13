import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class CookieGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.token;

    if (!token) throw new UnauthorizedException('Not authenticated');

    try {
      const payload = this.jwt.verify(token);
      req['admin'] = payload; // gắn vào request để dùng ở controller
      return true;
    } catch {
      throw new UnauthorizedException('Session expired, please login again');
    }
  }
}
