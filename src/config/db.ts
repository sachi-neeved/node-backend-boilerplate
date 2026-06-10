import mongoose from "mongoose";
import { APP_PORT, MONGO_URI, NODE_ENV } from "../lib/constants";
import logger from "../lib/logger";
import tryCatch from "../lib/utils/tryCatch";
import { DEFAULT_ROLES, RoleModel } from "../models/Role";

async function seedRoles() {
	for (const role of DEFAULT_ROLES) {
		await RoleModel.updateOne({ name: role.name }, { $setOnInsert: role }, { upsert: true });
	}
	logger?.info("Roles seeded.");
}

/**
 * Establishes a connection to the MongoDB database.
 *
 * This function attempts to connect to the MongoDB database using the URI defined in the environment variables.
 * If the connection is successful, it logs a success message to the console. If the connection fails, it logs the error message and exits the process.
 */
const connectDB = async () => {
	const [, err] = await tryCatch(() => mongoose.connect(MONGO_URI));

	if (err) {
		logger?.error(`Database connection failed: ${err}`);
		process.exit(1);
	}

	logger?.info("Starting Server.");
	logger?.info(`Port: ${APP_PORT}`);
	logger?.info(`NODE_ENV: ${NODE_ENV}`);
	logger?.info("Database Status: Connected!");
	await seedRoles();

	mongoose.connection.on("error", (connErr: Error) => {
		logger?.error(`Database error: ${connErr.message}`);
	});

	mongoose.connection.on("disconnected", () => {
		logger?.warn("Database disconnected.");
	});
};

export default connectDB;
