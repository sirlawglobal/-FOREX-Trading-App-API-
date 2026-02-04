import { Controller, Get, Query } from '@nestjs/common';
import { FxService } from './fx.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';

@ApiTags('fx')
@Controller('fx')
export class FxController {
  constructor(private fxService: FxService) {}

//   @Get('rates')
//   async getRates() {
//     return this.fxService.getAllRates();
//   }

// In fx.controller.ts


@Get('rates')
@ApiOperation({
  summary: 'Retrieve current FX rates',
  description: 'Returns exchange rates from NGN to supported currency pairs only (USD, EUR, GBP, CAD). Full rates are cached but filtered to app-supported pairs.',
})
async getRates() {
  return this.fxService.getAllRates();
}
}