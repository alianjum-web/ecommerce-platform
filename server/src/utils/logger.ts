// logger/index.ts - ENHANCE YOUR EXISTING PINO SETUP
import pino, { Logger } from "pino";
import { AuthenticatedRequest } from "../types/express";

const logger: Logger = pino({
  enabled: process.env.LOG_ENABLED !== "false",
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      node_version: process.version,
    }),
  },
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  // ✅ ADD structured logging helpers
  mixin: (context: object, level: number) => {
    return {
      environment: process.env.NODE_ENV || "development",
      ...context,
    };
  },
});

// Enhanced AppLogger with request context
export class AppLogger {
  constructor(private logger: Logger, private context: string) {}

  // ✅ METHOD SPECIFICALLY FOR REQUEST ERRORS
  requestError(
    error: Error,
    req: AuthenticatedRequest,
    operation: string
  ): void {
    this.logger.error(
      {
        context: this.context,
        operation,
        path: req.path,
        method: req.method,
        userId: req.user?.userId,
        body: process.env.NODE_ENV === "development" ? req.body : undefined,
        stack: error.stack,
      },
      `Request failed: ${error.message}`
    );
  }

  // ✅ GENERAL ERROR WITH CONTEXT
  error(error: Error | string, metadata?: any): void {
    if (error instanceof Error) {
      this.logger.error(
        {
          context: this.context,
          ...metadata,
          stack: error.stack,
        },
        error.message
      );
    } else {
      this.logger.error(
        {
          context: this.context,
          ...metadata,
        },
        error
      );
    }
  }

  warn(message: string, metadata?: any): void {
    this.logger.warn(
      {
        context: this.context,
        ...metadata,
      },
      message
    );
  }

  info(message: string, metadata?: any): void {
    this.logger.info(
      {
        context: this.context,
        ...metadata,
      },
      message
    );
  }

  debug(message: string, metadata?: any): void {
    this.logger.debug(
      {
        context: this.context,
        ...metadata,
      },
      message
    );
  }
}
// Factory function
export const createLogger = (context: string): AppLogger => {
  return new AppLogger(logger, context);
};

export default logger;
