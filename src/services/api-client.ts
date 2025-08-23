import axios, { AxiosInstance } from 'axios';
import { Agent } from 'http';
import { config } from '../config';
import { DiscordEventData } from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

interface CircuitBreakerState {
  failures: number;
  nextAttempt: number;
  state: 'closed' | 'open' | 'half-open';
}

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private circuitBreaker: CircuitBreakerState;
  private readonly maxFailures = 5;
  private readonly resetTimeoutMs = 60000;

  constructor() {
    this.circuitBreaker = {
      failures: 0,
      nextAttempt: 0,
      state: 'closed',
    };

    this.axiosInstance = axios.create({
      baseURL: config.api.url,
      timeout: config.api.timeout,
      httpAgent: config.api.keepAlive ? new Agent({ keepAlive: true }) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'User-Agent': 'Discord-Bot-Monitor/1.0.0',
        ...(config.security.apiKey && { 'X-API-Key': config.security.apiKey }),
        ...(config.security.webhookSecret && { 'X-Webhook-Secret': config.security.webhookSecret }),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      config => {
        logger.debug('API request started', {
          method: config.method?.toUpperCase(),
          url: config.url,
          timeout: config.timeout,
        });
        return config;
      },
      error => {
        logger.error('API request setup failed', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      response => {
        logger.debug('API response received', {
          status: response.status,
          statusText: response.statusText,
        });
        return response;
      },
      error => {
        logger.error('API response error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  private calculateBackoffDelay(attempt: number): number {
    return Math.min(config.api.retryDelay * Math.pow(2, attempt), 30000);
  }

  private updateCircuitBreaker(success: boolean): void {
    if (success) {
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.state = 'closed';
    } else {
      this.circuitBreaker.failures++;

      if (this.circuitBreaker.failures >= this.maxFailures) {
        this.circuitBreaker.state = 'open';
        this.circuitBreaker.nextAttempt = Date.now() + this.resetTimeoutMs;
        logger.warn('Circuit breaker opened due to failures', {
          failures: this.circuitBreaker.failures,
          nextAttempt: new Date(this.circuitBreaker.nextAttempt).toISOString(),
        });
      }
    }
  }

  private canMakeRequest(): boolean {
    if (this.circuitBreaker.state === 'closed') {
      return true;
    }

    if (this.circuitBreaker.state === 'open') {
      if (Date.now() >= this.circuitBreaker.nextAttempt) {
        this.circuitBreaker.state = 'half-open';
        logger.info('Circuit breaker entering half-open state');
        return true;
      }
      return false;
    }

    return true;
  }

  async sendEvent(eventData: DiscordEventData): Promise<void> {
    if (!config.api.enabled) {
      logger.debug('API externa desabilitada, evento não enviado', {
        eventType: eventData.eventType,
      });
      return;
    }

    if (!this.canMakeRequest()) {
      logger.warn('Circuit breaker is open, skipping API call', {
        eventType: eventData.eventType,
        nextAttempt: new Date(this.circuitBreaker.nextAttempt).toISOString(),
      });
      metrics.recordEventError(eventData.eventType);
      return;
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < config.api.retryAttempts; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateBackoffDelay(attempt - 1);
          logger.debug(`Retry attempt ${attempt + 1} after ${delay}ms`, {
            eventType: eventData.eventType,
          });
          // eslint-disable-next-line no-await-in-loop
          await this.delay(delay);
        }

        logger.event(eventData.eventType, { attempt: attempt + 1 });

        // Formato JSON-RPC 2.0 para MCP
        const mcpPayload = {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'DISCORD_WEBHOOK',
            arguments: eventData
          },
          id: Date.now() // ID único para a requisição
        };

        // eslint-disable-next-line no-await-in-loop
        const response = await this.axiosInstance.post('', mcpPayload);

        const responseTime = Date.now() - startTime;

        logger.apiCall('POST', config.api.url, response.status, responseTime);
        metrics.recordEvent(eventData.eventType, responseTime);
        metrics.recordApiRequest(true, responseTime);

        this.updateCircuitBreaker(true);
        return;
      } catch (error) {
        lastError = error as Error;
        const responseTime = Date.now() - startTime;

        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status;
          const shouldRetry = this.shouldRetry(error, attempt);

          logger.error(`API call failed (attempt ${attempt + 1})`, {
            eventType: eventData.eventType,
            status: statusCode,
            message: error.message,
            shouldRetry,
            responseTime,
          });

          metrics.recordApiRequest(false, responseTime, error.message, statusCode);

          if (!shouldRetry || attempt === config.api.retryAttempts - 1) {
            break;
          }
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Unexpected error (attempt ${attempt + 1})`, {
            eventType: eventData.eventType,
            error: errorMessage,
            responseTime,
          });

          metrics.recordApiRequest(false, responseTime, errorMessage);
          break;
        }
      }
    }

    this.updateCircuitBreaker(false);
    metrics.recordEventError(eventData.eventType);

    logger.error(`Failed to send event after ${config.api.retryAttempts} attempts`, {
      eventType: eventData.eventType,
      lastError: lastError?.message,
      circuitBreakerState: this.circuitBreaker.state,
    });
  }

  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= config.api.retryAttempts - 1) {
      return false;
    }

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return true;
      }

      if (error.response) {
        const status = error.response.status;
        return status >= 500 || status === 429 || status === 408;
      }

      return true;
    }

    return false;
  }

  getCircuitBreakerStatus(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      failures: 0,
      nextAttempt: 0,
      state: 'closed',
    };
    logger.info('Circuit breaker manually reset');
  }
}
