import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(DataSource) private dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    const dbConnected = this.dataSource.isInitialized ? 'connected' : 'disconnected';
    return {
      status: 'ok',
      uptime: process.uptime(),
      database: dbConnected,
      timestamp: new Date().toISOString(),
    };
  }
}