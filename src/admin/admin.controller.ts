import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getUsers({ page: +page, limit: +limit });
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Get('transactions')
  async getAllTransactions(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.adminService.getAllTransactions({ page: +page, limit: +limit });
  }

  @Get('users/:userId/transactions')
  async getUserTransactions(@Param('userId') userId: string) {
    return this.adminService.getUserTransactions(userId);
  }

  @Post('currencies')
  async addCurrency(@Body() body: { currency: string; rate?: number }) {
    return this.adminService.addCurrency(body.currency, body.rate);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
