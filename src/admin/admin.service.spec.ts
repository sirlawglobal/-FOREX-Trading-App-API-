import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: Repository<User>;
  let transactionRepo: Repository<Transaction>;

  const mockUserRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockTransactionRepo = {
    findAndCount: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepo,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    transactionRepo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [{ id: '1', email: 'test@example.com' }];
      const mockTotal = 1;
      mockUserRepo.findAndCount.mockResolvedValue([mockUsers, mockTotal]);

      const result = await service.getUsers({ page: 1, limit: 10 });

      expect(mockUserRepo.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        select: ['id', 'email', 'isVerified', 'role', 'createdAt'],
      });
      expect(result).toEqual({ users: mockUsers, total: mockTotal, page: 1, limit: 10 });
    });
  });

  describe('getUser', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getUser('1');

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        select: ['id', 'email', 'isVerified', 'role', 'createdAt'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getUser('1')).rejects.toThrow('User not found');
    });
  });

  describe('getAllTransactions', () => {
    it('should return paginated transactions', async () => {
      const mockTransactions = [{ id: '1', amount: 100 }];
      const mockTotal = 1;
      mockTransactionRepo.findAndCount.mockResolvedValue([mockTransactions, mockTotal]);

      const result = await service.getAllTransactions({ page: 1, limit: 10 });

      expect(mockTransactionRepo.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({ transactions: mockTransactions, total: mockTotal, page: 1, limit: 10 });
    });
  });

  describe('getUserTransactions', () => {
    it('should return transactions for a user', async () => {
      const mockTransactions = [{ id: '1', amount: 100 }];
      mockTransactionRepo.find.mockResolvedValue(mockTransactions);

      const result = await service.getUserTransactions('1');

      expect(mockTransactionRepo.find).toHaveBeenCalledWith({
        where: { userId: '1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('addCurrency', () => {
    it('should return a placeholder message', async () => {
      const result = await service.addCurrency('USD', 1.0);

      expect(result).toEqual({ message: 'Currency USD added/updated', rate: 1.0 });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      mockUserRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteUser('1');

      expect(mockUserRepo.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual({ message: 'User deleted' });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteUser('1')).rejects.toThrow('User not found');
    });
  });
});
