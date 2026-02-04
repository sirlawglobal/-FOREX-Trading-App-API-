import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { User } from '../src/entities/user.entity';
import { WalletBalance } from '../src/entities/wallet-balance.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let userRepo: Repository<User>;
  let balanceRepo: Repository<WalletBalance>;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          useFactory: (config: ConfigService) => ({
            type: 'postgres',
            host: config.get('DB_HOST', 'localhost'),
            port: config.get('DB_PORT', 5432),
            username: config.get('DB_USERNAME', 'testuser'),
            password: config.get('DB_PASSWORD', 'testpass'),
            database: config.get('DB_NAME', 'testdb'),
            synchronize: true,
            entities: [User, WalletBalance],
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([User, WalletBalance]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    balanceRepo = moduleFixture.get<Repository<WalletBalance>>(getRepositoryToken(WalletBalance));
    configService = moduleFixture.get<ConfigService>(ConfigService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await balanceRepo.clear();
    await userRepo.clear();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user and send OTP', async () => {
      const registerDto = { email: 'test@example.com' };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toEqual({ message: 'OTP sent to email' });

      // Check user was created
      const user = await userRepo.findOneBy({ email: registerDto.email });
      expect(user).toBeDefined();
      expect(user!.email).toBe(registerDto.email);
      expect(user!.isVerified).toBe(false);
      expect(user!.otp).toBeDefined();
      expect(user!.otpExpiresAt).toBeDefined();

      // Check wallet balances were created
      const balances = await balanceRepo.find({ where: { userId: user!.id } });
      expect(balances).toHaveLength(4);
      const currencies = balances.map(b => b.currency).sort();
      expect(currencies).toEqual(['EUR', 'GBP', 'NGN', 'USD']);
      balances.forEach(balance => {
        expect(balance.balance).toBe('0');
      });
    });

    it('should return 400 if email already exists', async () => {
      const registerDto = { email: 'existing@example.com' };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toBe('Email exists');
    });
  });

  describe('/auth/verify (POST)', () => {
    it('should verify user with correct OTP and return token', async () => {
      const email = 'verify@example.com';

      // Register user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email })
        .expect(201);

      // Get the OTP from database
      const user = await userRepo.findOneBy({ email });
      const otp = user!.otp; // In real scenario, this would be sent via email

      // Verify with correct OTP
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ email, otp })
        .expect(201);

      expect(response.body.message).toBe('Verified');
      expect(response.body.token).toBeDefined();

      // Check user is verified
      const updatedUser = await userRepo.findOneBy({ email });
      expect(updatedUser!.isVerified).toBe(true);
      expect(updatedUser!.otp).toBeNull();
      expect(updatedUser!.otpExpiresAt).toBeNull();
    });

    it('should return 400 for invalid OTP', async () => {
      const email = 'invalid@example.com';

      // Register user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email })
        .expect(201);

      // Verify with wrong OTP
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ email, otp: 'wrongotp' })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired OTP');
    });

    it('should return 400 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ email: 'nonexistent@example.com', otp: '123456' })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired OTP');
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login verified user and return token', async () => {
      const email = 'login@example.com';
      const password = 'password123';

      // Register and verify user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);

      const user = await userRepo.findOneBy({ email });
      const otp = user!.otp;

      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ email, otp })
        .expect(201);

      // Login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201);

      expect(response.body.message).toBe('Logged in');
      expect(response.body.token).toBeDefined();
    });

    it('should return 400 for unverified user', async () => {
      const email = 'unverified@example.com';
      const password = 'password123';

      // Register but don't verify
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);

      // Try to login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(400);

      expect(response.body.message).toBe('Account not verified');
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout authenticated user', async () => {
      const email = 'logout@example.com';
      const password = 'password123';

      // Register, verify, and login user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);

      const user = await userRepo.findOneBy({ email });
      const otp = user!.otp;

      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ email, otp })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201);

      const token = loginResponse.body.token;

      // Logout with token
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
    });
  });
});
