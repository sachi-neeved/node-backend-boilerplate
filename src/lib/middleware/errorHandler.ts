import type { Application, NextFunction, Request, Response } from "express";
import type { MongoServerError } from "mongodb";
import type { ErrorResponse } from "../../@types";
import { handleError } from "../handlers/handleError";

/**
 * Initializes the error handling middleware for the Express application.
 * @param app - The Express application instance.
 */
const inItErrorHandler = (app: Application) => {
	/**
	 * Middleware to handle errors in the application.
	 * This middleware catches and handles errors that occur during the request-response cycle.
	 * It can handle both custom ErrorResponse objects and MongoDB errors.
	 *
	 * @param err - The error object to be handled. Can be either an ErrorResponse or a MongoServerError.
	 * @param req - The request object.
	 * @param res - The response object.
	 * @param next - The next function in the middleware chain.
	 */
	const errorHandlerMiddleware = (
		err: ErrorResponse | MongoServerError,
		_req: Request,
		res: Response,
		_next: NextFunction,
	): void => {
		// Pass the error to the handleError function to handle and send the error response
		handleError(res, err);
	};
	// Use the errorHandlerMiddleware to catch and handle errors
	app.use(errorHandlerMiddleware);
};
export default inItErrorHandler;
