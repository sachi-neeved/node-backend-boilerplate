import dotenv from "dotenv-safe";

// Load environment variables
dotenv.config();

/**
 * JWT Secret Key for token-based authentication
 * @type {string}
 */
export const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY as string;

/**
 * Node Environment Variable to determine the environment (e.g., development, production)
 * @type {string}
 */
export const NODE_ENV: string = process.env.NODE_ENV as string;

/**
 * Domain of the application
 * @type {string}
 */
export const DOMAIN: string = process.env.DOMAIN as string;

/**
 * MongoDB URI for establishing a connection to the MongoDB database
 * @type {string}
 */
export const MONGO_URI: string = process.env.MONGO_URI as string;

/**
 * Max/min MongoDB connection pool size — optional, defaults to 20/2 when unset.
 * @type {number}
 */
export const DB_MAX_POOL_SIZE: number =
	Number.parseInt(process.env.DB_MAX_POOL_SIZE as string, 10) || 20;
export const DB_MIN_POOL_SIZE: number =
	Number.parseInt(process.env.DB_MIN_POOL_SIZE as string, 10) || 2;

/**
 * Redis Host for establishing a connection to the Redis server
 * @type {string}
 */
export const REDIS_HOST: string = process.env.REDIS_HOST as string;

/**
 * Redis Port for establishing a connection to the Redis server
 * @type {string}
 */
export const REDIS_PORT: string = process.env.REDIS_PORT as string;

/**
 * The port number on which the application is running
 * @type {string}
 */
export const APP_PORT: string = process.env.PORT as string;

/**
 * Environment variable indicating whether to use Redis for caching
 * @type {string}
 */
export const USE_REDIS: string = process.env.USE_REDIS as string;

/**
 * Allowed Origins
 * @type {string}
 */
export const ALLOWED_ORIGINS: string = process.env.ALLOWED_ORIGINS as string;

export const REFRESH_TOKEN_EXPIRY: number = Number.parseInt(
	process.env.REFRESH_TOKEN_EXPIRY as string,
	10,
);
export const ACCESS_TOKEN_EXPIRY: number = Number.parseInt(
	process.env.ACCESS_TOKEN_EXPIRY as string,
	10,
);

export const SMTP_HOST: string = process.env.SMTP_HOST as string;
export const SMTP_PORT: string = process.env.SMTP_PORT as string;
export const SMTP_USER: string = process.env.SMTP_USER as string;
export const SMTP_PASS: string = process.env.SMTP_PASS as string;
export const SMTP_FROM: string = process.env.SMTP_FROM as string;
