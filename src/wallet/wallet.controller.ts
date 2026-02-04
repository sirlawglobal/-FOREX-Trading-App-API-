

import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { FundDto } from './dto/fund.dto';
import { ConvertDto } from './dto/convert.dto';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('wallet')
@UseGuards(AuthGuard, RolesGuard) // Auth + Role check
@ApiBearerAuth() // For Swagger
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

//   @Get()
//   async getBalances(@Req() req) {
//     return this.walletService.getBalances(req.user.id);
//   }

@Roles(Role.USER)
@Get()
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency (e.g., NGN)' })
  async getBalances(@Req() req, @Query('currency') currency?: string) {
    if (currency) {
      return this.walletService.getBalanceByCurrency(req.user.id, currency.toUpperCase());
    }
    return this.walletService.getBalances(req.user.id);
  }

  @Roles(Role.USER)
  @Post('fund')
  async fund(@Req() req, @Body() dto: FundDto) {
    return this.walletService.fund(req.user.id, dto);
  }

  @Roles(Role.USER)
  @Post('convert')
  @ApiOperation({ summary: 'Convert between any two currencies using real-time rates' })
  @ApiResponse({ status: 200, description: 'Conversion successful' })
  @ApiResponse({ status: 400, description: 'Invalid input / insufficient balance / same currency' })
  async convert(@Req() req, @Body() dto: ConvertDto) {
    const userId = req.user.id; // from JWT
    return this.walletService.convert(userId, dto);
  }

  @Roles(Role.USER)
  @Post('trade')
  @ApiOperation({ summary: 'Trade NGN with other currencies (alias for convert)' })
  async trade(@Req() req, @Body() dto: ConvertDto) {
    // Spec has separate endpoint, but logic is the same
    return this.walletService.convert(req.user.id, dto);
  }

@Roles(Role.USER)
@Get('transactions')
async getTransactions(@Req() req) {
  return this.walletService.getTransactions(req.user.id);
}

}