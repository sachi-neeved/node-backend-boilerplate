import { createLogger, type Logger } from "winston";

/**
 * Builds a logger for test runs — same API surface as the dev/prod loggers so existing
 * `logger.info(...)`/`logger?.error(...)` calls throughout the app don't need to change,
 * but `silent: true` means nothing is written to the console or to disk during tests.
 */
const buildTestLogger = (): Logger => createLogger({ silent: true });

export default buildTestLogger;
