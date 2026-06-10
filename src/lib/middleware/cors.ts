import cors from "cors";
import type { Application } from "express";
import { ALLOWED_ORIGINS, NODE_ENV } from "../constants";
import { NodeENVEnums } from "../utils/enums";

/**
 * Initializes CORS middleware for the Express application.
 * This middleware sets up CORS policies based on the environment.
 * In development, it allows all origins. In other environments, it only allows specified origins.
 * @param app - The Express application.
 */
function inItCors(app: Application) {
	/**
	 * Dynamically sets the allowed origins based on the environment.
	 * In development, it allows all origins. In other environments, it uses the predefined allowed origins.
	 */
	const allowedOrigins = NODE_ENV === NodeENVEnums.DEVELOPMENT ? "*" : ALLOWED_ORIGINS;
	/**
	 * Creates a new CORS middleware instance with the dynamically set allowed origins.
	 * It also specifies the allowed HTTP methods, headers, and enables credentials.
	 */
	const newCors = cors({
		origin: allowedOrigins,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
		allowedHeaders: [
			"Origin",
			"Host",
			"Content-Type",
			"Content-Length",
			"Accept-Encoding",
			"Accept-Language",
			"Accept",
			"X-CSRF-Token",
			"Authorization",
			"X-Requested-With",
			"X-Access-Token",
		],
		exposedHeaders: ["Content-Length"],
		credentials: true,
	});
	/**
	 * Applies the CORS middleware to the Express application.
	 */
	app.use(newCors);
}

export default inItCors;
