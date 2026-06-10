import { createLogger, format, type Logger, transports } from "winston";

const { combine, colorize, timestamp, errors, printf } = format;

/**
 * Custom log format that includes timestamp, colorized level, message or stack trace, and metadata.
 *
 * @param {Object} info - Log information.
 * @param {string} info.level - Log level.
 * @param {string} info.message - Log message.
 * @param {string} info.timestamp - Log timestamp.
 * @param {string} [info.stack] - Stack trace (if available).
 * @returns {string} Formatted log string.
 */
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
	const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : "";
	return `${timestamp} ${level}: ${stack ?? message}${metaStr}`;
});

/**
 * Builds and returns a logger instance configured for development environments.
 * Outputs colorized logs to the console with timestamp, level, message/stack, and metadata.
 *
 * @returns {Logger} A Winston logger instance.
 */
const buildDevLogger = (): Logger => {
	return createLogger({
		level: "debug",
		format: combine(
			errors({ stack: true }), // must run first to extract stack from Error objects
			timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
			colorize({ all: true }),
			logFormat,
		),
		transports: [new transports.Console()], // Output logs to the console
		exceptionHandlers: [new transports.Console()],
		rejectionHandlers: [new transports.Console()],
	});
};

export default buildDevLogger;
