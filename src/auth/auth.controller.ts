import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags } from '@nestjs/swagger';
import { ResendDto } from './dto/resend.dto';
import { AuthGuard } from './auth.guard';

@ApiTags('auth') // For Swagger
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('verify')
  async verify(@Body() dto: VerifyDto) {
    return this.authService.verify(dto.email, dto.otp);
  }

  @Post('resend-otp')
async resendOtp(@Body() dto: ResendDto) {
  return this.authService.resendOtp(dto.email);
}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout() {
    return this.authService.logout();
  }
}
