import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ✅ NEW: Create admin endpoint
  @Post('create-admin')
  async createAdmin(@Body() body: { email: string; password: string; name: string }) {
    return this.authService.createAdmin(body.email, body.password, body.name);
  }

  // ✅ NEW: Make existing user admin
  @Post('make-admin')
  async makeAdmin(@Body() body: { email: string }) {
    return this.authService.makeAdmin(body.email);
  }

  // ✅ NEW: Setup default admin
  @Get('setup-admin')
  async setupAdmin() {
    return this.authService.setupDefaultAdmin();
  }

  // ✅ NEW: Get all admins
  @Get('admins')
  async getAllAdmins() {
    return this.authService.getAllAdmins();
  }
}
