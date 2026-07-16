import compression from "compression";
import type { Application } from "express";

/**
 * Initializes gzip response compression for the Express application.
 * @param app - The Express application.
 */
const inItCompression = (app: Application) => {
	app.use(compression());
};

export default inItCompression;
