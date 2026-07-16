/**
 * This is the main entry point of the application. It sets up the Express server,
 * loads environment variables, connects to the database, and defines routes.
 *
 * @author Sachidanand Shah
 * @version 1.0.0
 */

import express from "express";
import inItDb from "./config/db";
import { APP_PORT } from "./lib/constants";
import inItBodyParser from "./lib/middleware/bodyParser";
import inItCompression from "./lib/middleware/compression";
import inItCors from "./lib/middleware/cors";
import inItErrorHandler from "./lib/middleware/errorHandler";
import inItLogger from "./lib/middleware/logger";
import inItNonServiceRoutes from "./lib/middleware/nonServiceRoutes";
import inItRedis from "./lib/middleware/redis";
import initSwagger from "./lib/middleware/swagger";
import inItRouters from "./routes";

/**
 * Builds and wires up the Express application, without connecting to the database
 * or starting the HTTP listener — lets tests (e.g. supertest) get a fully-configured
 * app against a test database, with no real port bound.
 */
export const createApp = () => {
	const app = express();

	// Initialize body parser middleware
	inItBodyParser(app);

	// Initialize CORS middleware
	inItCors(app);

	// Initialize response compression middleware
	inItCompression(app);

	// Initialize Redis cache middleware
	inItRedis(app);

	// Initialize logger middleware
	inItLogger(app);

	// Initialize routers
	inItRouters(app);

	// Initialize Swagger UI (disabled in production)
	initSwagger(app);

	// Initialize non-service routes
	inItNonServiceRoutes(app);

	// Initialize Custom Error handler middleware
	inItErrorHandler(app);

	return app;
};

/**
 * Initializes the Express server, loads environment variables, connects to the database,
 * and sets up routes and middleware.
 */
const inItServer = () => {
	// Connect to the database
	inItDb();

	const app = createApp();

	// Start the server
	app.listen(APP_PORT);
};

export default inItServer;
