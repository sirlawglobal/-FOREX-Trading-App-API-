import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with correct email and password', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password123' };
      const expectedResult = { message: 'OTP sent to email' };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verify', () => {
    it('should call authService.verify with correct email and otp', async () => {
      const verifyDto: VerifyDto = { email: 'test@example.com', otp: '123456' };
      const expectedResult = { token: 'jwtToken', message: 'Verified' };

      mockAuthService.verify.mockResolvedValue(expectedResult);

      const result = await controller.verify(verifyDto);

      expect(mockAuthService.verify).toHaveBeenCalledWith(verifyDto.email, verifyDto.otp);
      expect(result).toEqual(expectedResult);
    });
  });
});
