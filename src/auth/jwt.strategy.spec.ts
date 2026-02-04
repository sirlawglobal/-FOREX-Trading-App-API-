import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepo: Repository<User>;
  let configService: ConfigService;

  const mockUserRepo = {
    findOneBy: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-jwt-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user for valid verified user', async () => {
      const payload = { sub: 'userId', email: 'test@example.com', isVerified: true };
      const user = { id: 'userId', email: 'test@example.com', isVerified: true };

      mockUserRepo.findOneBy.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 'userId' });
      expect(result).toEqual(user);
    });

    it('should return null for unverified user', async () => {
      const payload = { sub: 'userId', email: 'test@example.com', isVerified: false };
      const user = { id: 'userId', email: 'test@example.com', isVerified: false };

      mockUserRepo.findOneBy.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 'userId' });
      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const payload = { sub: 'nonexistentId', email: 'test@example.com', isVerified: true };

      mockUserRepo.findOneBy.mockResolvedValue(null);

      const result = await strategy.validate(payload);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 'nonexistentId' });
      expect(result).toBeNull();
    });
  });
});
