/**
 * This is the main entry point of the application. It sets up the Express server,
 * loads environment variables, connects to the database, and defines routes.
 *
 * @author Sachidanand Shah
 * @version 1.0.0
 */

import dotenvSafe from "dotenv-safe";
import express from "express";
import connectDB from "./config/db";
import { APP_PORT } from "./lib/constants";
import inItBodyParser from "./lib/middleware/bodyParser";
import inItCors from "./lib/middleware/cors";
import inItErrorHandler from "./lib/middleware/errorHandler";
import inItLogger from "./lib/middleware/logger";
import inItNonServiceRoutes from "./lib/middleware/nonServiceRoutes";
import inItRedis from "./lib/middleware/redis";
import initSwagger from "./lib/middleware/swagger";
import inItRouters from "./routes";

/**
 * Initializes the Express server, loads environment variables, connects to the database,
 * and sets up routes and middleware.
 */
const inItServer = () => {
	// Load environment variables
	dotenvSafe.config();

	// Connect to the database
	connectDB();

	const app = express();

	// Initialize body parser middleware
	inItBodyParser(app);

	// Initialize CORS middleware
	inItCors(app);

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

	// Start the server
	app.listen(APP_PORT);
};

export default inItServer;
