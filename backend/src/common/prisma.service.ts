import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const dbUrl = process.env.DATABASE_URL || 'dev.db';
    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
      super();
    } else {
      // Strip 'file:' prefix if present — the adapter expects a plain path
      const dbPath = dbUrl.replace(/^file:\.?\/?/, '');
      const adapter = new PrismaBetterSqlite3({ url: dbPath });
      super({ adapter });
    }
  }

  async onModuleInit() {
    await this.$connect();
    console.log('📦 Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
