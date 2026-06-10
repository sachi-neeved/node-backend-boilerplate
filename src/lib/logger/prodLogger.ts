import { createLogger, format, type Logger, transports } from "winston";
import "winston-daily-rotate-file";

/**
 * Shared JSON log format used across all production transports.
 * Includes timestamp, error stack traces, and structured JSON output.
 */
const sharedFormat = format.combine(
	format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	format.errors({ stack: true }),
	format.json(),
);

/**
 * Builds and returns a logger instance configured for production environments.
 * Outputs structured JSON logs to the console and to daily rotating log files.
 * Separate files are maintained for all logs and error-only logs.
 * Uncaught exceptions and unhandled rejections are written to dedicated files.
 *
 * @returns {Logger} A Winston logger instance.
 */
const buildProdLogger = (): Logger => {
	return createLogger({
		level: "info",
		format: sharedFormat,
		transports: [
			new transports.Console(),
			new transports.DailyRotateFile({
				filename: "logs/%DATE%-all.log",
				datePattern: "YYYY-MM-DD",
				level: "info",
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
			new transports.File({ filename: "logs/exceptions.log", format: sharedFormat }),
		],
		rejectionHandlers: [
			new transports.File({ filename: "logs/rejections.log", format: sharedFormat }),
		],
	});
};

export default buildProdLogger;
