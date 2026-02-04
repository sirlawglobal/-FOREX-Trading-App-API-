import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(WalletBalance) private balanceRepo: Repository<WalletBalance>,
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.userRepo.findOneBy({ email });
    if (existing) throw new BadRequestException('Email exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    const user = this.userRepo.create({ email, password: hashedPassword, otp: hashedOtp, otpExpiresAt: expires });
    await this.userRepo.save(user);

    // Seed initial balances (spec: initial balance, multi-currency)
    const currencies = this.config.get('SUPPORTED_BALANCE_CURRENCIES').split(',');
    for (const curr of currencies) {
      const balance = this.balanceRepo.create({ userId: user.id, currency: curr, balance: '0' });
      await this.balanceRepo.save(balance);
    }

    // Send OTP email (spec: any mail provider)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: this.config.get('SMTP_USER'), pass: this.config.get('SMTP_PASS') },
    });
    await transporter.sendMail({ to: email, subject: 'OTP Verification', text: `Your OTP is ${otp}. Expires in 5 min.` });

    return { message: 'OTP sent to email' };
  }

  async verify(email: string, otp: string) {
    const user = await this.userRepo.findOneBy({ email });
    if (!user || !user.otp || !user.otpExpiresAt || new Date() > user.otpExpiresAt || !(await bcrypt.compare(otp, user.otp))) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await this.userRepo.save(user);

    const payload = { sub: user.id, email: user.email, isVerified: true };
    const token = this.jwt.sign(payload);
    return { token, message: 'Verified' };
  }

// ... existing imports and constructor ...

async resendOtp(email: string) {
  const user = await this.userRepo.findOneBy({ email });
  if (!user) throw new BadRequestException('Email not registered');
  if (user.isVerified) throw new BadRequestException('Already verified—log in instead');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  user.otp = hashedOtp;
  user.otpExpiresAt = expires;
  await this.userRepo.save(user);

  // Send new OTP (or console log in temp fix)
  // TEMPORARY: Log to console
  console.log('\n🔥🔥🔥 NEW OTP FOR', email, '→', otp, '🔥🔥🔥');
  console.log('Copy this OTP and use it in /auth/verify\n');

  // Real email (uncomment when fixed):
  /*
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: this.config.get('SMTP_USER'), pass: this.config.get('SMTP_PASS') },
  });
  await transporter.sendMail({ to: email, subject: 'New OTP Verification', text: `Your new OTP is ${otp}. Expires in 5 min.` });
  */

  return { message: 'New OTP sent (check email or console)' };
}

  async login(email: string, password: string) {
    const user = await this.userRepo.findOneBy({ email });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new BadRequestException('Account not verified');
    }

    const payload = { sub: user.id, email: user.email, isVerified: true };
    const token = this.jwt.sign(payload);
    return { token, message: 'Logged in' };
  }

  async logout() {
    return { message: 'Logged out successfully' };
  }
}
