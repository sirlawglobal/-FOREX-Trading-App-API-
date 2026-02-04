import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { FxService } from './fx.service';
import { FxController } from './fx.controller';

@Module({
  imports: [HttpModule, ConfigModule.forRoot()],
  controllers: [FxController],
  providers: [FxService],
  exports: [FxService], // For use in wallet
})
export class FxModule {}
