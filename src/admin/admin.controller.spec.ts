import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getUsers: jest.fn(),
    getUser: jest.fn(),
    getAllTransactions: jest.fn(),
    getUserTransactions: jest.fn(),
    addCurrency: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should call adminService.getUsers with correct params', async () => {
      const mockResult = { users: [], total: 0, page: 1, limit: 10 };
      mockAdminService.getUsers.mockResolvedValue(mockResult);

      const result = await controller.getUsers(1, 10);

      expect(mockAdminService.getUsers).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUser', () => {
    it('should call adminService.getUser with correct id', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockAdminService.getUser.mockResolvedValue(mockUser);

      const result = await controller.getUser('1');

      expect(mockAdminService.getUser).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getAllTransactions', () => {
    it('should call adminService.getAllTransactions with correct params', async () => {
      const mockResult = { transactions: [], total: 0, page: 1, limit: 10 };
      mockAdminService.getAllTransactions.mockResolvedValue(mockResult);

      const result = await controller.getAllTransactions(1, 10);

      expect(mockAdminService.getAllTransactions).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserTransactions', () => {
    it('should call adminService.getUserTransactions with correct userId', async () => {
      const mockTransactions = [{ id: '1', amount: 100 }];
      mockAdminService.getUserTransactions.mockResolvedValue(mockTransactions);

      const result = await controller.getUserTransactions('1');

      expect(mockAdminService.getUserTransactions).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('addCurrency', () => {
    it('should call adminService.addCurrency with correct params', async () => {
      const mockResult = { message: 'Currency USD added/updated', rate: 1.0 };
      mockAdminService.addCurrency.mockResolvedValue(mockResult);

      const result = await controller.addCurrency({ currency: 'USD', rate: 1.0 });

      expect(mockAdminService.addCurrency).toHaveBeenCalledWith('USD', 1.0);
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteUser', () => {
    it('should call adminService.deleteUser with correct id', async () => {
      const mockResult = { message: 'User deleted' };
      mockAdminService.deleteUser.mockResolvedValue(mockResult);

      const result = await controller.deleteUser('1');

      expect(mockAdminService.deleteUser).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });
});
