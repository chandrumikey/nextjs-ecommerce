import { Controller, Post, Body, Get } from '@nestjs/common';
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

  // Admin creation endpoint (protected or public based on your needs)
  @Post('create-admin')
  async createAdmin(
    @Body() body: { email: string; password: string; name: string }
  ) {
    return this.authService.createAdmin(body.email, body.password, body.name);
  }

  // Setup default admin endpoint
  @Get('setup-default-admin')
  async setupDefaultAdmin() {
    return this.authService.setupDefaultAdmin();
  }
}
