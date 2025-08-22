import { config } from '../config';
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private maxEvents: number;
  private windowMs: number;

  constructor() {
    this.maxEvents = config.rateLimit.maxEventsPerMinute;
    this.windowMs = config.rateLimit.windowMs;

    setInterval(() => this.cleanup(), this.windowMs);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  private getKey(channelId: string, eventType: string): string {
    return `${channelId}:${eventType}`;
  }

  isAllowed(channelId: string, eventType: string): boolean {
    const key = this.getKey(channelId, eventType);
    const now = Date.now();

    let entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
      };
      this.requests.set(key, entry);
    }

    if (entry.count >= this.maxEvents) {
      logger.warn(`Rate limit exceeded for channel ${channelId} event ${eventType}`, {
        currentCount: entry.count,
        maxEvents: this.maxEvents,
        resetTime: new Date(entry.resetTime).toISOString(),
      });
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(channelId: string, eventType: string): number {
    const key = this.getKey(channelId, eventType);
    const entry = this.requests.get(key);

    if (!entry || Date.now() > entry.resetTime) {
      return this.maxEvents;
    }

    return Math.max(0, this.maxEvents - entry.count);
  }

  getResetTime(channelId: string, eventType: string): Date | null {
    const key = this.getKey(channelId, eventType);
    const entry = this.requests.get(key);

    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }

    return new Date(entry.resetTime);
  }

  getStats(): { totalKeys: number; activeRequests: number } {
    const now = Date.now();
    let activeRequests = 0;

    for (const entry of this.requests.values()) {
      if (now <= entry.resetTime) {
        activeRequests += entry.count;
      }
    }

    return {
      totalKeys: this.requests.size,
      activeRequests,
    };
  }
}
