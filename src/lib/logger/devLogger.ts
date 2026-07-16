import { createLogger, format, type Logger, transports } from "winston";
import "winston-daily-rotate-file";

const { combine, colorize, timestamp, errors, printf } = format;

/**
 * Custom log format that includes timestamp, level, message or stack trace, and metadata.
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

const baseFormat = combine(
	errors({ stack: true }), // must run first to extract stack from Error objects
	timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
);

/** Colorized console format — color codes only belong on a terminal, never in a log file. */
const consoleFormat = combine(baseFormat, colorize({ all: true }), logFormat);
const fileFormat = combine(baseFormat, logFormat);

/**
 * Builds and returns a logger instance configured for development environments.
 * Outputs colorized logs to the console, and — dev-only, unlike production — also writes
 * to a local `logs/` folder (daily rotating files, plus dedicated exception/rejection files)
 * so a crash or an error a few requests back can still be found after the console scrolled by.
 *
 * @returns {Logger} A Winston logger instance.
 */
const buildDevLogger = (): Logger => {
	return createLogger({
		level: "debug",
		format: fileFormat,
		transports: [
			new transports.Console({ format: consoleFormat }),
			new transports.DailyRotateFile({
				filename: "logs/%DATE%-all.log",
				datePattern: "YYYY-MM-DD",
				maxFiles: "14d",
				maxSize: "20m",
				zippedArchive: true,
			}),
			new transports.DailyRotateFile({
				filename: "logs/%DATE%-errors.log",
				datePattern: "YYYY-MM-DD",
				level: "error",
				maxFiles: "30d",
				maxSize: "20m",
				zippedArchive: true,
			}),
		],
		exceptionHandlers: [
			new transports.Console({ format: consoleFormat }),
			new transports.File({ filename: "logs/exceptions.log", format: fileFormat }),
		],
		rejectionHandlers: [
			new transports.Console({ format: consoleFormat }),
			new transports.File({ filename: "logs/rejections.log", format: fileFormat }),
		],
	});
};

export default buildDevLogger;
