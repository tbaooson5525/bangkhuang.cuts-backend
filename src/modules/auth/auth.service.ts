import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.jwt.sign({ sub: admin.id, email: admin.email });
  }

  async changePassword(
    adminId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const admin = await this.prisma.admin.findUniqueOrThrow({
      where: { id: adminId },
    });

    const valid = await bcrypt.compare(oldPassword, admin.password);
    if (!valid) throw new UnauthorizedException('Mật khẩu cũ không đúng');

    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới tối thiểu 6 ký tự');
    }

    if (await bcrypt.compare(newPassword, admin.password)) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng mật khẩu cũ',
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { password: hashed },
    });
  }
}
