import { logger } from './logger';

interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

const configSchema: ValidationSchema = {
  DISCORD_TOKEN: {
    required: true,
    type: 'string',
    pattern: /^[A-Za-z0-9._-]+$/,
  },
  API_URL: {
    required: false,
    type: 'string',
    pattern: /^https?:\/\/.+/,
  },
  API_TIMEOUT: {
    required: false,
    type: 'number',
    min: 1000,
    max: 300000,
  },
  API_RETRY_ATTEMPTS: {
    required: false,
    type: 'number',
    min: 1,
    max: 10,
  },
  API_RETRY_DELAY: {
    required: false,
    type: 'number',
    min: 100,
    max: 10000,
  },
  API_KEEP_ALIVE: {
    required: false,
    type: 'boolean',
  },
  LOG_LEVEL: {
    required: false,
    type: 'string',
    enum: ['debug', 'info', 'warn', 'error'],
  },
  LOG_COLORS: {
    required: false,
    type: 'boolean',
  },
  MAX_EVENTS_PER_MINUTE: {
    required: false,
    type: 'number',
    min: 1,
    max: 10000,
  },
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    type: 'number',
    min: 1000,
    max: 3600000,
  },
  HEALTH_CHECK_ENABLED: {
    required: false,
    type: 'boolean',
  },
  HEALTH_CHECK_PORT: {
    required: false,
    type: 'number',
    min: 1000,
    max: 65535,
  },
  API_KEY: {
    required: false,
    type: 'string',
  },
  WEBHOOK_SECRET: {
    required: false,
    type: 'string',
  },
  MONITORED_CHANNELS: {
    required: false,
    type: 'string',
  },
};

interface ValidationError {
  field: string;
  value: string | undefined;
  message: string;
}

export class ConfigValidator {
  private errors: ValidationError[] = [];

  validate(): boolean {
    this.errors = [];

    for (const [field, rule] of Object.entries(configSchema)) {
      const value = process.env[field];
      this.validateField(field, value, rule);
    }

    if (this.errors.length > 0) {
      logger.error('Configuration validation failed:', {
        errors: this.errors,
        totalErrors: this.errors.length,
      });

      for (const error of this.errors) {
        logger.error(`  ❌ ${error.field}: ${error.message}`);
      }

      return false;
    }

    logger.info('✅ Configuration validation passed');
    this.logConfigSummary();
    return true;
  }

  private validateField(field: string, value: string | undefined, rule: ValidationRule): void {
    if (rule.required && (!value || value.trim() === '')) {
      this.errors.push({
        field,
        value,
        message: 'Required field is missing or empty',
      });
      return;
    }

    if (!value) {
      return;
    }

    if (rule.type) {
      if (!this.validateType(field, value, rule.type)) {
        return;
      }
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      this.errors.push({
        field,
        value,
        message: `Does not match required pattern: ${rule.pattern}`,
      });
      return;
    }

    if (rule.enum && !rule.enum.includes(value.toLowerCase())) {
      this.errors.push({
        field,
        value,
        message: `Must be one of: ${rule.enum.join(', ')}`,
      });
      return;
    }

    if (rule.type === 'number') {
      const numValue = parseInt(value, 10);

      if (rule.min !== undefined && numValue < rule.min) {
        this.errors.push({
          field,
          value,
          message: `Must be at least ${rule.min}`,
        });
        return;
      }

      if (rule.max !== undefined && numValue > rule.max) {
        this.errors.push({
          field,
          value,
          message: `Must be at most ${rule.max}`,
        });
        return;
      }
    }
  }

  private validateType(field: string, value: string, expectedType: string): boolean {
    switch (expectedType) {
      case 'string': {
        return true;
      }
      case 'number': {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
          this.errors.push({
            field,
            value,
            message: 'Must be a valid number',
          });
          return false;
        }
        return true;
      }
      case 'boolean': {
        const lowerValue = value.toLowerCase();
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(lowerValue)) {
          this.errors.push({
            field,
            value,
            message: 'Must be a boolean value (true/false, 1/0, yes/no)',
          });
          return false;
        }
        return true;
      }
      default: {
        return true;
      }
    }
  }

  private logConfigSummary(): void {
    const summary = {
      discord: {
        tokenProvided: !!process.env.DISCORD_TOKEN,
      },
      api: {
        enabled: !!process.env.API_URL,
        url: process.env.API_URL ? 'configured' : 'not configured',
        timeout: process.env.API_TIMEOUT ?? '120000 (default)',
        retryAttempts: process.env.API_RETRY_ATTEMPTS ?? '3 (default)',
        keepAlive: process.env.API_KEEP_ALIVE ?? 'true (default)',
      },
      logging: {
        level: process.env.LOG_LEVEL ?? 'info (default)',
        colors: process.env.LOG_COLORS ?? 'true (default)',
      },
      rateLimit: {
        maxEventsPerMinute: process.env.MAX_EVENTS_PER_MINUTE ?? '100 (default)',
        windowMs: process.env.RATE_LIMIT_WINDOW_MS ?? '60000 (default)',
      },
      security: {
        apiKeyProvided: !!process.env.API_KEY,
        webhookSecretProvided: !!process.env.WEBHOOK_SECRET,
      },
      healthCheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED ?? 'true (default)',
        port: process.env.HEALTH_CHECK_PORT ?? '3000 (default)',
      },
      channels: {
        monitoredChannels: process.env.MONITORED_CHANNELS
          ? `${process.env.MONITORED_CHANNELS.split(',').length} channels`
          : 'all channels (default)',
      },
    };

    logger.info('🔧 Configuration Summary:', summary);
  }

  getErrors(): ValidationError[] {
    return [...this.errors];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}

export const configValidator = new ConfigValidator();
