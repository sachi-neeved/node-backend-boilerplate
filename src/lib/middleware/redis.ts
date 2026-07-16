import type { Application, NextFunction, Request, Response } from "express";
import { createClient } from "redis";
import { CookieName } from "../../config/cookie";
import { REDIS_HOST, REDIS_PORT, USE_REDIS } from "../constants";
import logger from "../logger";

const CACHE_NAMESPACE = "expresscache";
const CACHE_TTL_SECONDS = 60;

/** True if the request is authenticated — these responses must never be cached by URL alone. */
const isAuthenticatedRequest = (req: Request): boolean =>
	Boolean(req.cookies?.[CookieName.AccessToken] || req.headers.authorization);

/**
 * Initializes Redis caching middleware for the Express application.
 * Uses the `redis` client directly (not the abandoned `express-expeditious` +
 * `expeditious-engine-redis` packages, which pin vulnerable versions of
 * `redis`/`async` with no fixed release available — nothing's shipped since 2019).
 *
 * @param app - The Express application instance.
 * @returns The Redis caching middleware instance or null if Redis is not enabled.
 */
const inItRedis = (app: Application): undefined | null => {
	if (USE_REDIS !== "true") {
		logger?.info("Redis Caching: Not enabled");
		return null;
	}

	const client = createClient({
		socket: {
			host: REDIS_HOST || "localhost",
			port: Number(REDIS_PORT) || 6379,
		},
	});
	client.on("error", (error) => logger?.error("Redis client error:", error));
	client
		.connect()
		.then(() => logger?.info("Redis Caching: Enabled"))
		.catch((error) => logger?.error("Error initializing Redis caching:", error));

	app.use((req: Request, res: Response, next: NextFunction) => {
		if (req.method !== "GET" || isAuthenticatedRequest(req) || !client.isReady) {
			return next();
		}

		const key = `${CACHE_NAMESPACE}:${req.originalUrl}`;

		client
			.get(key)
			.then((cached) => {
				if (!cached) return next();
				res.setHeader("Content-Type", "application/json");
				res.send(cached);
			})
			.catch((error) => {
				logger?.error("Redis cache read error:", error);
				next();
			});

		const originalJson = res.json.bind(res);
		res.json = (body: unknown) => {
			client.set(key, JSON.stringify(body), { EX: CACHE_TTL_SECONDS }).catch((error) => {
				logger?.error("Redis cache write error:", error);
			});
			return originalJson(body);
		};
	});

	return null;
};

export default inItRedis;
