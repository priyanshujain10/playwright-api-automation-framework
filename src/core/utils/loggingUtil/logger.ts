import path from 'path';
import winston from 'winston';
import logConfig from '../../../../logger.config.json'


winston.addColors({
    info: 'green',
    warn: 'yellow',
    error: 'red',
});

const LOG_DIR = path.join('reports', path.dirname(logConfig?.logger?.file?.filename ?? 'logs/api-automation.log'));

/**
 * Determines the log level for the logger based on environment variables or config.
 * @returns The log level string, defaulting to 'info' if invalid.
 */
function getLogLevel(): string {
    const level = process.env.LOG_LEVEL || logConfig?.logger?.level || 'info';
    const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
    return validLevels.includes(level) ? level : 'info';
}

/**
 * The main logger instance configured with Winston for API automation tests.
 */
export const logger = winston.createLogger({
    level: getLogLevel(),
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'ecommerce-api-tests' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                })
            )
        }),
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'api-automation.log'),
            level: 'error',
            maxsize: logConfig?.logger?.file?.maxsize,
            maxFiles: logConfig?.logger?.file?.maxFiles
        }),
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'combined.log'),
            maxsize: logConfig?.logger?.file?.maxsize,
            maxFiles: logConfig?.logger?.file?.maxFiles
        })
    ]
});