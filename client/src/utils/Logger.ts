// utils/logger.ts - COMPLETE PRODUCTION LOGGER
type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private isDevelopment: boolean;
  private prefix: string;

  constructor(prefix: string = '') {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  private shouldLog(level: LogLevel): boolean {
    // In development, log everything
    if (this.isDevelopment) return true;
    
    // In production, only log errors and warnings
    return level === 'error' || level === 'warn';
  }

  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    const timestamp = new Date().toISOString();
    const levelPrefix = `[${level.toUpperCase()}]`;
    const prefix = this.prefix ? `${this.prefix} ` : '';
    
    return [`${timestamp} ${levelPrefix} ${prefix}`, ...args];
  }

  log(...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...this.formatMessage('log', ...args));
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', ...args));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', ...args));
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', ...args));
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', ...args));
    }
  }

  // Method for HTTP requests
  http(method: string, url: string, status?: number, data?: any): void {
    if (this.shouldLog('info')) {
      const statusText = status ? ` ${status}` : '';
      console.info(...this.formatMessage('info', `${method} ${url}${statusText}`, data || ''));
    }
  }

  // Method for authentication events
  auth(event: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', `🔐 AUTH: ${event}`, ...args));
    }
  }

  // Method for performance tracking
  perf(operation: string, duration: number): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', `⏱️ PERF: ${operation} took ${duration}ms`));
    }
  }
}

// Create default logger instance
export const logger = new Logger();

// Create named loggers for different parts of your app
export const createLogger = (prefix: string) => new Logger(prefix);

// Specific loggers for different modules
export const authLogger = createLogger('AUTH');
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('DB');