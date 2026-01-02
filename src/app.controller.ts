import { Controller, Get } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from './db';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
  };
}

@Controller()
export class AppController {
  private readonly startTime = Date.now();

  @Get('health')
  async getHealth(): Promise<HealthCheckResponse> {
    const dbHealth = await this.checkDatabase();

    return {
      status: dbHealth.status === 'up' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        database: dbHealth,
      },
    };
  }

  private async checkDatabase(): Promise<HealthCheckResponse['services']['database']> {
    const start = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      return {
        status: 'up',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
