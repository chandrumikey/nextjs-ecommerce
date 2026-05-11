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

  // Check if this email should be admin (e.g., specific email)
  const isAdminEmail = registerDto.email === 'admin@example.com';
  
  const user = await this.prisma.user.create({
    data: {
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: isAdminEmail ? 'ADMIN' : 'CUSTOMER',
    },
  });

  const token = this.generateToken(user.id, user.email, user.role);
  return { user: this.excludePassword(user), token };
}
