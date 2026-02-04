import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
// import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { FxModule } from './fx/fx.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        synchronize: true,
        entities: [join(__dirname, '**/*.entity.{ts,js}')],
      }),
      inject: [ConfigService],
    }),

    AuthModule,

    WalletModule,

    FxModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
