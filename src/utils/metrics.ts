import { logger } from './logger';

interface EventMetric {
  count: number;
  totalResponseTime: number;
  errors: number;
  lastEvent: string;
}

interface ApiMetric {
  requests: number;
  successCount: number;
  errorCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  lastRequest: string;
  errors: Array<{
    timestamp: string;
    error: string;
    statusCode?: number;
  }>;
}

export class MetricsCollector {
  private eventMetrics: Map<string, EventMetric> = new Map();
  private apiMetrics: ApiMetric = {
    requests: 0,
    successCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    lastRequest: '',
    errors: [],
  };
  private startTime: Date = new Date();

  recordEvent(eventType: string, responseTime?: number): void {
    let metric = this.eventMetrics.get(eventType);

    if (!metric) {
      metric = {
        count: 0,
        totalResponseTime: 0,
        errors: 0,
        lastEvent: '',
      };
      this.eventMetrics.set(eventType, metric);
    }

    metric.count++;
    metric.lastEvent = new Date().toISOString();

    if (responseTime) {
      metric.totalResponseTime += responseTime;
    }

    logger.debug(`Event recorded: ${eventType}`, { count: metric.count, responseTime });
  }

  recordEventError(eventType: string): void {
    let metric = this.eventMetrics.get(eventType);

    if (!metric) {
      metric = {
        count: 0,
        totalResponseTime: 0,
        errors: 0,
        lastEvent: '',
      };
      this.eventMetrics.set(eventType, metric);
    }

    metric.errors++;
    logger.debug(`Event error recorded: ${eventType}`, { errors: metric.errors });
  }

  recordApiRequest(
    success: boolean,
    responseTime: number,
    error?: string,
    statusCode?: number
  ): void {
    this.apiMetrics.requests++;
    this.apiMetrics.totalResponseTime += responseTime;
    this.apiMetrics.averageResponseTime =
      this.apiMetrics.totalResponseTime / this.apiMetrics.requests;
    this.apiMetrics.lastRequest = new Date().toISOString();

    if (success) {
      this.apiMetrics.successCount++;
    } else {
      this.apiMetrics.errorCount++;

      if (error) {
        this.apiMetrics.errors.push({
          timestamp: new Date().toISOString(),
          error,
          statusCode,
        });

        if (this.apiMetrics.errors.length > 100) {
          this.apiMetrics.errors = this.apiMetrics.errors.slice(-100);
        }
      }
    }

    logger.debug('API request recorded', {
      success,
      responseTime: `${responseTime}ms`,
      totalRequests: this.apiMetrics.requests,
    });
  }

  getEventMetrics(): Record<
    string,
    EventMetric & { averageResponseTime: number; errorRate: number }
  > {
    const result: Record<string, EventMetric & { averageResponseTime: number; errorRate: number }> =
      {};

    for (const [eventType, metric] of this.eventMetrics) {
      result[eventType] = {
        ...metric,
        averageResponseTime: metric.count > 0 ? metric.totalResponseTime / metric.count : 0,
        errorRate: metric.count > 0 ? (metric.errors / metric.count) * 100 : 0,
      };
    }

    return result;
  }

  getApiMetrics(): ApiMetric & { successRate: number } {
    return {
      ...this.apiMetrics,
      successRate:
        this.apiMetrics.requests > 0
          ? (this.apiMetrics.successCount / this.apiMetrics.requests) * 100
          : 0,
    };
  }

  getOverallStats(): {
    uptime: string;
    totalEvents: number;
    totalApiRequests: number;
    overallSuccessRate: number;
    eventTypes: string[];
  } {
    const uptime = Date.now() - this.startTime.getTime();
    const totalEvents = Array.from(this.eventMetrics.values()).reduce(
      (sum, metric) => sum + metric.count,
      0
    );

    return {
      uptime: this.formatUptime(uptime),
      totalEvents,
      totalApiRequests: this.apiMetrics.requests,
      overallSuccessRate:
        this.apiMetrics.requests > 0
          ? (this.apiMetrics.successCount / this.apiMetrics.requests) * 100
          : 0,
      eventTypes: Array.from(this.eventMetrics.keys()),
    };
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m ${seconds % 60}s`;
    }
  }

  logSummary(): void {
    const eventMetrics = this.getEventMetrics();
    const apiMetrics = this.getApiMetrics();
    const overallStats = this.getOverallStats();

    logger.info('📊 Metrics Summary', {
      uptime: overallStats.uptime,
      totalEvents: overallStats.totalEvents,
      totalApiRequests: overallStats.totalApiRequests,
      overallSuccessRate: `${overallStats.overallSuccessRate.toFixed(2)}%`,
      apiAverageResponseTime: `${apiMetrics.averageResponseTime.toFixed(2)}ms`,
      eventTypes: overallStats.eventTypes,
    });

    for (const [eventType, metrics] of Object.entries(eventMetrics)) {
      if (metrics.count > 0) {
        logger.debug(`Event ${eventType} metrics`, {
          count: metrics.count,
          averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
          errorRate: `${metrics.errorRate.toFixed(2)}%`,
        });
      }
    }
  }
}

export const metrics = new MetricsCollector();
