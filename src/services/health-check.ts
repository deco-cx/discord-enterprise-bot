import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { config } from '../config';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: string;
  discord: {
    connected: boolean;
    user?: string;
  };
  api: {
    enabled: boolean;
    lastSuccessfulCall?: string;
    successRate: number;
  };
  metrics: {
    totalEvents: number;
    totalApiRequests: number;
    rateLimitHits?: number;
  };
}

export class HealthCheckServer {
  private server: Server | null = null;
  private discordConnected: boolean = false;
  private discordUser?: string;
  private lastSuccessfulApiCall?: Date;

  constructor() {
    if (config.health.enabled) {
      this.setupServer();
    }
  }

  private setupServer(): void {
    this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
      this.handleRequest(req, res);
    });

    this.server.listen(config.health.port, () => {
      logger.info(`🏥 Health check server started on port ${config.health.port}`);
    });

    this.server.on('error', (error: Error) => {
      logger.error('Health check server error:', error);
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url ?? '';

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method !== 'GET') {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    try {
      switch (url) {
        case '/health':
        case '/':
          this.handleHealthCheck(res);
          break;
        case '/metrics':
          this.handleMetrics(res);
          break;
        case '/ready':
          this.handleReadinessCheck(res);
          break;
        case '/live':
          this.handleLivenessCheck(res);
          break;
        default:
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      logger.error('Error handling health check request:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  private handleHealthCheck(res: ServerResponse): void {
    const healthStatus = this.getHealthStatus();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    res.writeHead(statusCode);
    res.end(JSON.stringify(healthStatus, null, 2));
  }

  private handleMetrics(res: ServerResponse): void {
    const eventMetrics = metrics.getEventMetrics();
    const apiMetrics = metrics.getApiMetrics();
    const overallStats = metrics.getOverallStats();

    const metricsData = {
      overall: overallStats,
      events: eventMetrics,
      api: apiMetrics,
      timestamp: new Date().toISOString(),
    };

    res.writeHead(200);
    res.end(JSON.stringify(metricsData, null, 2));
  }

  private handleReadinessCheck(res: ServerResponse): void {
    const isReady =
      this.discordConnected && (config.api.enabled ? !!this.lastSuccessfulApiCall : true);
    const statusCode = isReady ? 200 : 503;

    res.writeHead(statusCode);
    res.end(
      JSON.stringify({
        ready: isReady,
        discord: this.discordConnected,
        api: config.api.enabled ? !!this.lastSuccessfulApiCall : 'disabled',
        timestamp: new Date().toISOString(),
      })
    );
  }

  private handleLivenessCheck(res: ServerResponse): void {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        alive: true,
        timestamp: new Date().toISOString(),
      })
    );
  }

  private getHealthStatus(): HealthStatus {
    const apiMetrics = metrics.getApiMetrics();
    const overallStats = metrics.getOverallStats();

    const isHealthy =
      this.discordConnected && (config.api.enabled ? apiMetrics.successRate > 50 : true);

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: overallStats.uptime,
      discord: {
        connected: this.discordConnected,
        user: this.discordUser,
      },
      api: {
        enabled: config.api.enabled,
        lastSuccessfulCall: this.lastSuccessfulApiCall?.toISOString(),
        successRate: apiMetrics.successRate,
      },
      metrics: {
        totalEvents: overallStats.totalEvents,
        totalApiRequests: overallStats.totalApiRequests,
      },
    };
  }

  setDiscordStatus(connected: boolean, user?: string): void {
    this.discordConnected = connected;
    this.discordUser = user;

    logger.info(`Discord status updated: ${connected ? 'connected' : 'disconnected'}`);
  }

  recordSuccessfulApiCall(): void {
    this.lastSuccessfulApiCall = new Date();
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise<void>(resolve => {
        this.server!.close(() => {
          logger.info('🏥 Health check server stopped');
          resolve();
        });
      });
    }
  }
}
