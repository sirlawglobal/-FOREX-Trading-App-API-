import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FxService } from './fx.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('fx')
@UseGuards(AuthGuard, RolesGuard)
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