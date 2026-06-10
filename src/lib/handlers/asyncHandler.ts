import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * A utility function to handle asynchronous operations in Express routes.
 * It wraps the provided function in a Promise and catches any errors that might occur,
 * passing them to the next middleware function in the Express chain. This allows for
 * a more elegant way of handling asynchronous operations within Express routes, ensuring
 * that any errors are properly propagated to the error handling middleware.
 *
 * @param {Function} fn - The function to be wrapped. It should return a Promise.
 * This function is expected to handle the asynchronous operation and return a Promise.
 * The function will be called with the Express request, response, and next middleware
 * function as arguments.
 * @returns {Function} - A new function that wraps the provided function. This returned
 * function is designed to be used directly in Express routes. It will call the original
 * function with the request, response, and next middleware function, and handle any
 * errors that might occur by passing them to the next middleware function.
 */
const asyncHandler =
	(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
	(req: Request, res: Response, next: NextFunction) => {
		// Wrap the original function in a Promise to handle any errors that might occur.
		// If an error occurs, it will be caught and passed to the next middleware function.
		Promise.resolve(fn(req, res, next)).catch(next);
	};

export default asyncHandler;
