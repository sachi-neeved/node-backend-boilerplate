import { createLogger, format, type Logger, transports } from "winston";

/**
 * Shared JSON log format used for production output.
 * Includes timestamp, error stack traces, and structured JSON output.
 */
const sharedFormat = format.combine(
	format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	format.errors({ stack: true }),
	format.json(),
);

/**
 * Builds and returns a logger instance configured for production environments.
 * Outputs structured JSON logs to the console only — no local log files. Production
 * runs are expected to ship console output to whatever log aggregator sits in front of
 * them; writing to a local `logs/` folder is a dev-only convenience (see devLogger.ts).
 *
 * @returns {Logger} A Winston logger instance.
 */
const buildProdLogger = (): Logger => {
	return createLogger({
		level: "info",
		format: sharedFormat,
		transports: [new transports.Console()],
		exceptionHandlers: [new transports.Console()],
		rejectionHandlers: [new transports.Console()],
	});
};

export default buildProdLogger;
