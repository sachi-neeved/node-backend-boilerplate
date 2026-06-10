import type { Application, NextFunction, Request, Response } from "express";
import logger from "../logger";

/** Keys whose values are replaced with [REDACTED] before logging. */
const SENSITIVE_KEYS = new Set([
	"password",
	"confirmPassword",
	"token",
	"accessToken",
	"refreshToken",
	"otp",
]);

/**
 * Returns a shallow copy of `body` with sensitive field values replaced by `[REDACTED]`.
 *
 * @param body - The request body object to sanitize.
 * @returns Sanitized copy of the body.
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(body).map(([k, v]) => [k, SENSITIVE_KEYS.has(k) ? "[REDACTED]" : v]),
	);
}

/**
 * Initializes the request logger middleware for the Express application.
 * Logs each completed request with method, URL, status code, duration, and sanitized body.
 * Log level is derived from the response status code: info (2xx/3xx), warn (4xx), error (5xx).
 *
 * @param app - The Express application.
 */
const inItLogger = (app: Application) => {
	/**
	 * Middleware that records request duration and logs a single line on response finish.
	 *
	 * @param req - The Express request object.
	 * @param res - The Express response object.
	 * @param next - The next middleware function.
	 */
	const requestLogger = (req: Request, res: Response, next: NextFunction) => {
		const start = Date.now();

		res.once("finish", () => {
			const durationMs = Date.now() - start;
			const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

			logger[level](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
				durationMs,
				query: req.query,
				params: req.params,
				body: sanitizeBody(req.body ?? {}),
			});
		});

		next();
	};

	app.use(requestLogger);
};

export default inItLogger;
