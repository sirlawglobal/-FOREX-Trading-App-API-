// import { Injectable, BadRequestException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { DataSource, Repository } from 'typeorm';
// import { WalletBalance } from '../entities/wallet-balance.entity';
// import { Transaction } from '../entities/transaction.entity';
// import Decimal from 'decimal.js';
import { FundDto } from './dto/fund.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { Transaction } from '../entities/transaction.entity';
import { FxService } from '../fx/fx.service';
import { ConvertDto } from './dto/convert.dto';
import Decimal from 'decimal.js';

@Injectable()
export class WalletService {
  // constructor(
  //   @InjectRepository(WalletBalance) private balanceRepo: Repository<WalletBalance>,
  //   @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
  //   private dataSource: DataSource,
  // ) {}

  constructor(
      @InjectRepository(WalletBalance)
      private balanceRepo: Repository<WalletBalance>,
      @InjectRepository(Transaction)
      private txRepo: Repository<Transaction>,
      private dataSource: DataSource,
      private fxService: FxService,
    ) {}

  async getBalances(userId: string) {
    const balances = await this.balanceRepo.find({ where: { userId } });
    if (!balances.length) throw new BadRequestException('No balances');
    return balances.map((b) => ({ currency: b.currency, balance: b.balance }));
  }

  async getBalanceByCurrency(userId: string, currency: string) {
  const balance = await this.balanceRepo.findOne({ where: { userId, currency } });
  if (!balance) throw new BadRequestException(`No balance for ${currency}`);
  return { currency: balance.currency, balance: balance.balance };
}

  async fund(userId: string, dto: FundDto) {
    const { currency, amount, txId } = dto;
    if (txId && await this.txRepo.findOneBy({ id: txId })) throw new BadRequestException('Duplicate transaction');

    return this.dataSource.transaction(async (manager) => {
      const bal = await manager.findOneOrFail(WalletBalance, { where: { userId, currency } });
      const newBalance = new Decimal(bal.balance).plus(amount).toString();
      await manager.update(WalletBalance, { id: bal.id }, { balance: newBalance });

      const tx = manager.create(Transaction, {
        id: txId, // Idempotency
        userId,
        type: 'FUND',
        fromCurrency: currency,
        fromAmount: amount.toString(),
        status: 'SUCCESS',
        description: `Funded ${amount} ${currency}`,
      });
      await manager.save(tx);

      return { message: 'Wallet funded', newBalance };
    });
  }

   async convert(userId: string, dto: ConvertDto) {
      const { fromCurrency, toCurrency, amount, idempotencyKey } = dto;
  
      if (fromCurrency === toCurrency) {
        throw new BadRequestException('Cannot convert to the same currency');
      }
  
      if (amount <= 0) {
        throw new BadRequestException('Amount must be positive');
      }
  
      // Idempotency check (bonus – prevents duplicate conversions)
      if (idempotencyKey) {
        const existingTx = await this.txRepo.findOne({ where: { idempotencyKey } });
        if (existingTx) {
          return { message: 'Duplicate request', transactionId: existingTx.id };
        }
      }
  
      // Get real-time rate
      const rate = await this.fxService.getRate(fromCurrency, toCurrency);
      if (!rate || rate.lte(0)) {
        throw new BadRequestException('Unable to fetch exchange rate');
      }
  
      const toAmount = new Decimal(amount).mul(rate).toDecimalPlaces(8).toString();
  
      // Atomic transaction
      return this.dataSource.transaction(async (manager) => {
        // Pessimistic lock on FROM balance to prevent race conditions
        const fromBalance = await manager.findOne(WalletBalance, {
          where: { userId, currency: fromCurrency },
          lock: { mode: 'pessimistic_write' },
        });
  
        if (!fromBalance) {
          throw new BadRequestException(`No ${fromCurrency} balance found`);
        }
  
        const currentFrom = new Decimal(fromBalance.balance);
        if (currentFrom.lt(amount)) {
          throw new BadRequestException(`Insufficient ${fromCurrency} balance`);
        }
  
        // Update FROM balance
        fromBalance.balance = currentFrom.sub(amount).toString();
        await manager.save(fromBalance);
  
        // Find or create TO balance
        let toBalance = await manager.findOne(WalletBalance, {
          where: { userId, currency: toCurrency },
        });
  
        if (!toBalance) {
          toBalance = manager.create(WalletBalance, {
            userId,
            currency: toCurrency,
            balance: '0',
          });
          await manager.save(toBalance);
        }
  
        // Update TO balance
        const currentTo = new Decimal(toBalance.balance);
        toBalance.balance = currentTo.add(toAmount).toString();
        await manager.save(toBalance);
  
        // Log transaction
        const tx = manager.create(Transaction, {
          userId,
          type: 'CONVERT',
          fromCurrency,
          fromAmount: amount.toString(),
          toCurrency,
          toAmount,
          rateUsed: rate.toString(),
          status: 'SUCCESS',
          description: `Converted ${amount} ${fromCurrency} to ${toAmount} ${toCurrency}`,
          idempotencyKey, // store if provided
        });
        await manager.save(tx);
  
        return {
          message: 'Conversion successful',
          fromCurrency,
          fromAmount: amount,
          toCurrency,
          toAmount,
          rate: rate.toString(),
          transactionId: tx.id,
        };
      });
    }

async getTransactions(userId: string) {
  return this.txRepo.find({
    where: { userId },
    order: { createdAt: 'DESC' },
    take: 50, // Paginate for scale
  });
}

}