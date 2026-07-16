import cookieParser from "cookie-parser";
import { type Application, json, urlencoded } from "express";

/**
 * Initializes the body parser middleware for the Express application.
 * This middleware is used to parse URL-encoded and JSON bodies.
 * @param app - The Express application.
 */
const inItBodyParser = (app: Application) => {
	// to parse URL-encoded bodies
	app.use(urlencoded({ extended: true, limit: "1mb" }));
	// to parse JSON bodies
	app.use(json({ limit: "1mb" }));
	// to parse cookies
	app.use(cookieParser());
};

export default inItBodyParser;
