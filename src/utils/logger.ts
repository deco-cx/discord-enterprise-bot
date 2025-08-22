/* eslint-disable no-unused-vars */
import { config } from '../config';

type LogMetadata =
  | Record<string, unknown>
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | unknown;

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel;
  private enableColors: boolean;

  constructor() {
    this.logLevel = this.parseLogLevel(config.logging.level);
    this.enableColors = config.logging.enableColors;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private colorize(text: string, color: string): string {
    if (!this.enableColors) {
      return text;
    }

    const colors = {
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      green: '\x1b[32m',
      gray: '\x1b[90m',
      reset: '\x1b[0m',
    };

    return `${colors[color as keyof typeof colors] || ''}${text}${colors.reset}`;
  }

  private formatLogEntry(level: string, message: string, meta?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const levelColors = {
      DEBUG: 'gray',
      INFO: 'blue',
      WARN: 'yellow',
      ERROR: 'red',
    };

    const coloredLevel = this.colorize(
      level.padEnd(5),
      levelColors[level as keyof typeof levelColors] || 'reset'
    );
    const coloredTimestamp = this.colorize(timestamp, 'gray');

    let logMessage = `${coloredTimestamp} [${coloredLevel}] ${message}`;

    if (meta && Object.keys(meta).length > 0) {
      logMessage += `\n${this.colorize(JSON.stringify(meta, null, 2), 'gray')}`;
    }

    return logMessage;
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: LogMetadata): void {
    if (level < this.logLevel) {
      return;
    }

    const formattedMessage = this.formatLogEntry(levelName, message, meta);
    console.log(formattedMessage);
  }

  debug(message: string, meta?: LogMetadata): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  info(message: string, meta?: LogMetadata): void {
    this.log(LogLevel.INFO, 'INFO', message, meta);
  }

  warn(message: string, meta?: LogMetadata): void {
    this.log(LogLevel.WARN, 'WARN', message, meta);
  }

  error(message: string, meta?: LogMetadata): void {
    this.log(LogLevel.ERROR, 'ERROR', message, meta);
  }

  event(eventType: string, data?: LogMetadata): void {
    this.info(`📤 Event: ${eventType}`, data);
  }

  apiCall(method: string, url: string, status?: number, duration?: number): void {
    const meta = { method, url, status, duration: duration ? `${duration}ms` : undefined };
    if (status && status >= 400) {
      this.error(`API call failed`, meta);
    } else {
      this.info(`API call completed`, meta);
    }
  }

  botEvent(event: string, data?: LogMetadata): void {
    this.info(`🤖 Bot: ${event}`, data);
  }
}

export const logger = new Logger();
