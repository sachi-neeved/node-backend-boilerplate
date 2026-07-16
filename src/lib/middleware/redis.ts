import type { Application, NextFunction, Request, Response } from "express";
import getExpeditiousCache from "express-expeditious";
import { CookieName } from "../../config/cookie";
import { REDIS_HOST, REDIS_PORT, USE_REDIS } from "../constants";
import logger from "../logger";

/** True if the request is authenticated — these responses must never be cached by URL alone. */
const isAuthenticatedRequest = (req: Request): boolean =>
	Boolean(req.cookies?.[CookieName.AccessToken] || req.headers.authorization);

/**
 * Initializes Redis caching middleware for the Express application.
 *
 * @param app - The Express application instance.
 * @returns The Redis caching middleware instance or null if Redis is not enabled.
 */
const inItRedis = (app: Application): undefined | null => {
	if (USE_REDIS === "true") {
		try {
			const engine = require("expeditious-engine-redis")({
				redis: {
					host: REDIS_HOST || "localhost",
					port: Number(REDIS_PORT) || 6379,
				},
			});

			// Configure the cache using Expeditious
			const cache = getExpeditiousCache({
				namespace: "expresscache",
				defaultTtl: "1 minute",
				engine,
			});

			// If cache is initialized successfully, use it in the Express app
			if (cache) {
				// Never let expeditious cache authenticated requests — it keys purely by
				// URL/method, so caching e.g. GET /auth/me would serve one user's response
				// to any other user hitting the same URL within the TTL window.
				app.use((req: Request, res: Response, next: NextFunction) =>
					isAuthenticatedRequest(req) ? next() : cache(req, res, next),
				);
				logger?.info("Redis Caching: Enabled");
			} else {
				logger?.error("Failed to initialize caching.");
			}
		} catch (error) {
			// Log the error when Redis connection or engine initialization fails
			logger?.error("Error initializing Redis caching:", error);
			return null;
		}
	} else {
		logger?.info("Redis Caching: Not enabled");
	}

	// Return null if Redis is not enabled or an error occurs
	return null;
};

export default inItRedis;
