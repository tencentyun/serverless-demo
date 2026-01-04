import { LogLevel, LoggerFunction, LoggingConfig } from '../types';
/**
 * Logger used by the driver to notify about various internal events. Single logger should be used per driver.
 */
export declare class Logger {
    private readonly _level;
    private readonly _loggerFunction;
    /**
     * @constructor
     * @param {string} level the enabled logging level.
     * @param {function(level: string, message: string)} loggerFunction the function to write the log level and message.
     */
    constructor(level: LogLevel, loggerFunction: LoggerFunction);
    /**
     * Create a new logger based on the given driver configuration.
     * @param {Object} driverConfig the driver configuration as supplied by the user.
     * @return {Logger} a new logger instance or a no-op logger when not configured.
     */
    static create(driverConfig: {
        logging?: LoggingConfig;
    }): Logger;
    /**
     * Create a no-op logger implementation.
     * @return {Logger} the no-op logger implementation.
     */
    static noOp(): Logger;
    /**
     * Check if error logging is enabled, i.e. it is not a no-op implementation.
     * @return {boolean} `true` when enabled, `false` otherwise.
     */
    isErrorEnabled(): boolean;
    /**
     * Log an error message.
     * @param {string} message the message to log.
     */
    error(message: string): void;
    /**
     * Check if warn logging is enabled, i.e. it is not a no-op implementation.
     * @return {boolean} `true` when enabled, `false` otherwise.
     */
    isWarnEnabled(): boolean;
    /**
     * Log an warning message.
     * @param {string} message the message to log.
     */
    warn(message: string): void;
    /**
     * Check if info logging is enabled, i.e. it is not a no-op implementation.
     * @return {boolean} `true` when enabled, `false` otherwise.
     */
    isInfoEnabled(): boolean;
    /**
     * Log an info message.
     * @param {string} message the message to log.
     */
    info(message: string): void;
    /**
     * Check if debug logging is enabled, i.e. it is not a no-op implementation.
     * @return {boolean} `true` when enabled, `false` otherwise.
     */
    isDebugEnabled(): boolean;
    /**
     * Log a debug message.
     * @param {string} message the message to log.
     */
    debug(message: string): void;
}
