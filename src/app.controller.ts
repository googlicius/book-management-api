import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private prismaService: PrismaService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth(): Promise<string> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return 'OK';
    } catch (error) {
      throw new Error('Database connection failed');
    }
  }
}
