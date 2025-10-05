import pino, { Logger, LoggerOptions } from 'pino';

type Environment = 'development' | 'production' | 'test';

interface LoggerConfig extends LoggerOptions {
    enabled: boolean;
}

const currentEnvironment = (process.env.NODE_ENV || 'development') as Environment; 

const config: LoggerConfig = {
    enabled: process.env.LOG_ENABLED !== 'false', // Disable in tests
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => ({ level: label.toUpperCase() }), // Structured logging
    }, 
    transport: currentEnvironment === 'development' ? {
        target: 'pino-pretty', 
        options: { 
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
        },
    } : undefined
} 

const logger: Logger = pino(config);

export default logger;
export type AppLogger = typeof logger;