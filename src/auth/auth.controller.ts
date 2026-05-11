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

  // ✅ ADD THIS METHOD - Create Admin
  async createAdmin(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedUser = await this.prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name: name,
          role: 'ADMIN',
        },
      });
      const token = this.generateToken(updatedUser.id, updatedUser.email, updatedUser.role);
      return { 
        message: 'Existing user updated to admin',
        user: this.excludePassword(updatedUser), 
        token 
      };
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { 
      message: 'Admin user created successfully',
      user: this.excludePassword(user), 
      token 
    };
  }

  // ✅ ADD THIS METHOD - Setup default admin
  async setupDefaultAdmin() {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminName = 'Super Admin';

    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await this.prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      return { message: 'Default admin created', user: this.excludePassword(admin) };
    } else if (existingAdmin.role !== 'ADMIN') {
      const updatedAdmin = await this.prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' },
      });
      return { message: 'User updated to admin', user: this.excludePassword(updatedAdmin) };
    }

    return { message: 'Admin already exists', user: this.excludePassword(existingAdmin) };
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
