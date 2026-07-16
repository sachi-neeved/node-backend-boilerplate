import mongoose from "mongoose";
import {
	APP_PORT,
	DB_MAX_POOL_SIZE,
	DB_MIN_POOL_SIZE,
	MONGO_URI,
	NODE_ENV,
} from "../lib/constants";
import logger from "../lib/logger";
import tryCatch from "../lib/utils/tryCatch";

/**
 * Initializes the MongoDB connection using the URI and pool settings defined in config.
 */
const inItDb = async () => {
	const [, err] = await tryCatch(() =>
		mongoose.connect(MONGO_URI, {
			maxPoolSize: DB_MAX_POOL_SIZE,
			minPoolSize: DB_MIN_POOL_SIZE,
			serverSelectionTimeoutMS: 5000,
		}),
	);

	if (err) {
		logger?.error(`Database connection failed: ${err}`);
		process.exit(1);
	}

	logger?.info("Starting Server.");
	logger?.info(`Port: ${APP_PORT}`);
	logger?.info(`NODE_ENV: ${NODE_ENV}`);
	logger?.info("Database Status: Connected!");

	mongoose.connection.on("error", (connErr: Error) => {
		logger?.error(`Database error: ${connErr.message}`);
	});

	mongoose.connection.on("disconnected", () => {
		logger?.warn("Database disconnected.");
	});
};

export default inItDb;
