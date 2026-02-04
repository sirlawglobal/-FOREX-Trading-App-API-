import { Test, TestingModule } from '@nestjs/testing';
import { FxController } from './fx.controller';
import { FxService } from './fx.service';
import { ConfigService } from '@nestjs/config';

describe('FxController', () => {
  let controller: FxController;

  const mockFxService = {
    getAllRates: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPPORTED_TO_CURRENCIES') return 'USD,EUR,GBP,CAD';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FxController],
      providers: [
        {
          provide: FxService,
          useValue: mockFxService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<FxController>(FxController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
