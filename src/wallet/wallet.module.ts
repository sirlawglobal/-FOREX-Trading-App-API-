import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { Transaction } from '../entities/transaction.entity';
import { AuthModule } from '../auth/auth.module';
import { FxModule } from '../fx/fx.module';

@Module({
  imports: [TypeOrmModule.forFeature([WalletBalance, Transaction]), AuthModule, FxModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}