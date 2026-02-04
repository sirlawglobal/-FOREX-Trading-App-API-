import { Test, TestingModule } from '@nestjs/testing';
import { FxService } from './fx.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

describe('FxService', () => {
  let service: FxService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPPORTED_TO_CURRENCIES') return 'USD,EUR,GBP,CAD';
      return undefined;
    }),
  };

  beforeEach(async () => {
    // Mock config before creating the module
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'SUPPORTED_TO_CURRENCIES') return 'USD,EUR,GBP,CAD';
      return undefined;
    });

    // Mock http.get to return an Observable
    mockHttpService.get.mockReturnValue(of({ data: { rates: { USD: 1, EUR: 0.8, GBP: 0.7, CAD: 1.2 } } }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FxService>(FxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
