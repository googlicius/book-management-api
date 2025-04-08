import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    let DATABASE_URL = process.env.DATABASE_URL;
    const DATABASE_USERNAME = process.env.DATABASE_USERNAME;
    const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
    const DATABASE_HOST = process.env.DATABASE_HOST;
    const DATABASE_PORT = process.env.DATABASE_PORT;
    const DATABASE_NAME = process.env.DATABASE_NAME;

    if (DATABASE_USERNAME && DATABASE_PASSWORD && DATABASE_HOST && DATABASE_PORT && DATABASE_NAME) {
      DATABASE_URL = `postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public`;
    }

    super({
      datasourceUrl: DATABASE_URL,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
