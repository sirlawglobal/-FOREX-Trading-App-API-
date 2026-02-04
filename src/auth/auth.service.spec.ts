import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

jest.mock('bcrypt');
jest.mock('nodemailer');

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let balanceRepo: Repository<WalletBalance>;
  let configService: ConfigService;
  let jwtService: JwtService;

  const mockUserRepo = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBalanceRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPPORTED_BALANCE_CURRENCIES') return 'NGN,USD,EUR,GBP';
      if (key === 'SMTP_USER') return 'smtpUser';
      return undefined;
    }),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(WalletBalance),
          useValue: mockBalanceRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    balanceRepo = module.get<Repository<WalletBalance>>(getRepositoryToken(WalletBalance));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);

    // Mock Math.random to generate predictable OTP
    jest.spyOn(Math, 'random').mockReturnValue(0.123456);

    // Mock config
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'SUPPORTED_BALANCE_CURRENCIES') return 'NGN,USD,EUR,GBP';
      if (key === 'SMTP_USER') return 'smtpUser';
      return undefined;
    });

    // Mock bcrypt
    (bcrypt.hash as jest.Mock).mockImplementation((value: string) => {
      if (value === 'password123') return Promise.resolve('hashedPassword');
      if (value === '211110') return Promise.resolve('hashedOtp');
      return Promise.resolve('hashed');
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Mock nodemailer
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({}),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const otp = '123456';
      const expires = new Date(Date.now() + 5 * 60 * 1000);

      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({ email, password: 'hashedPassword', otp: 'hashedOtp', otpExpiresAt: expires });
      mockUserRepo.save.mockResolvedValue({ id: 'userId', email, password: 'hashedPassword', otp: 'hashedOtp', otpExpiresAt: expires });
      mockBalanceRepo.create.mockReturnValue({});
      mockBalanceRepo.save.mockResolvedValue({});

      const result = await service.register(email, password);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ email });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(bcrypt.hash).toHaveBeenCalledWith('211110', 10);
      expect(mockUserRepo.create).toHaveBeenCalledWith({ email, password: 'hashedPassword', otp: 'hashedOtp', otpExpiresAt: expect.any(Date) });
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockBalanceRepo.create).toHaveBeenCalledTimes(4);
      expect(mockBalanceRepo.save).toHaveBeenCalledTimes(4);
      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(result).toEqual({ message: 'OTP sent to email' });
    });

    it('should throw BadRequestException if email already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';
      mockUserRepo.findOneBy.mockResolvedValue({ email });

      await expect(service.register(email, password)).rejects.toThrow(BadRequestException);
      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ email });
    });
  });

  describe('verify', () => {
    it('should verify user successfully and return token', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      const user = {
        id: 'userId',
        email,
        otp: 'hashedOtp',
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isVerified: false,
        role: 'user',
      };
      const token = 'jwtToken';

      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockUserRepo.save.mockResolvedValue({ ...user, isVerified: true, otp: null, otpExpiresAt: null });
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.verify(email, otp);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(otp, 'hashedOtp');
      expect(mockUserRepo.save).toHaveBeenCalledWith({ ...user, isVerified: true, otp: null, otpExpiresAt: null });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email, isVerified: true, role: user.role });
      expect(result).toEqual({ token, message: 'Verified' });
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      const email = 'test@example.com';
      const otp = 'wrongOtp';
      const user = {
        id: 'userId',
        email,
        otp: 'hashedOtp',
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        role: 'user',
      };

      mockUserRepo.findOneBy.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.verify(email, otp)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired OTP', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      const user = {
        id: 'userId',
        email,
        otp: 'hashedOtp',
        otpExpiresAt: new Date(Date.now() - 10 * 60 * 1000), // expired
      };

      mockUserRepo.findOneBy.mockResolvedValue(user);

      await expect(service.verify(email, otp)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user not found', async () => {
      const email = 'nonexistent@example.com';
      const otp = '123456';

      mockUserRepo.findOneBy.mockResolvedValue(null);

      await expect(service.verify(email, otp)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should login user successfully and return token', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = {
        id: 'userId',
        email,
        password: 'hashedPassword',
        isVerified: true,
        role: 'user',
      };
      const token = 'jwtToken';

      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(email, password);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword');
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email, isVerified: true, role: user.role });
      expect(result).toEqual({ token, message: 'Logged in' });
    });

    it('should throw BadRequestException for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongPassword';
      const user = {
        id: 'userId',
        email,
        password: 'hashedPassword',
        isVerified: true,
      };

      mockUserRepo.findOneBy.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(email, password)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if account not verified', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = {
        id: 'userId',
        email,
        password: 'hashedPassword',
        isVerified: false,
      };

      mockUserRepo.findOneBy.mockResolvedValue(user);

      await expect(service.login(email, password)).rejects.toThrow(BadRequestException);
    });
  });
});
