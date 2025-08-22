import dotenv from 'dotenv';
import { configValidator } from './utils/config-validator';

dotenv.config();

if (!configValidator.validate()) {
  console.error('❌ Configuration validation failed. Please check your environment variables.');
  process.exit(1);
}

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
  },
  api: {
    url: process.env.API_URL || '',
    enabled: !!process.env.API_URL,
    timeout: parseInt(process.env.API_TIMEOUT || '120000', 10),
    retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.API_RETRY_DELAY || '1000', 10),
    keepAlive: process.env.API_KEEP_ALIVE !== 'false',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableColors: process.env.LOG_COLORS !== 'false',
  },
  rateLimit: {
    maxEventsPerMinute: parseInt(process.env.MAX_EVENTS_PER_MINUTE || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },
  security: {
    apiKey: process.env.API_KEY || '',
    webhookSecret: process.env.WEBHOOK_SECRET || '',
  },
  health: {
    enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
    port: parseInt(process.env.HEALTH_CHECK_PORT || '3000', 10),
  },
  monitoredChannels: process.env.MONITORED_CHANNELS?.split(',') || [],
};

