import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { WalletService } from './wallet.service';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { Transaction } from '../entities/transaction.entity';
import { FxService } from '../fx/fx.service';

describe('WalletService', () => {
  let service: WalletService;
  let balanceRepo: Repository<WalletBalance>;
  let txRepo: Repository<Transaction>;
  let dataSource: DataSource;

  const mockBalanceRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTxRepo = {
    findOneBy: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockFxService = {
    getRate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(WalletBalance),
          useValue: mockBalanceRepo,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTxRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: FxService,
          useValue: mockFxService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    balanceRepo = module.get<Repository<WalletBalance>>(getRepositoryToken(WalletBalance));
    txRepo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
