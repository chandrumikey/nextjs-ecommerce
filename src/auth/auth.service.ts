import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Validate required fields
    if (!registerDto.email || !registerDto.password || !registerDto.name) {
      throw new ConflictException('Email, password, and name are required');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { user: this.excludePassword(user), token };
  }

  async login(loginDto: LoginDto) {
    if (!loginDto.email || !loginDto.password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return { user: this.excludePassword(user), token };
  }

  private generateToken(userId: number, email: string, role: string) {
    return this.jwtService.sign({ sub: userId, email, role });
  }

  private excludePassword(user: any) {
    const { password, ...result } = user;
    return result;
  }

  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
