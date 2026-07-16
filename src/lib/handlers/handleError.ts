import type { Response } from "express";
import { MongoServerError } from "mongodb";
import type { ErrorResponse } from "../../types";
import { NODE_ENV } from "../constants";
import logger from "../logger";
import { AppError } from "../utils/buildError";
import { NodeENVEnums } from "../utils/enums";
import { StatusCodes } from "../utils/statusCodes";

/**
 * Generates an error response
 * @param res - Express response object
 * @param err - Error object
 */
const generateErrorResponse = (res: Response, err: ErrorResponse): void => {
	const code =
		typeof err?.code === "number" && err.code >= 100 && err.code < 600
			? err.code
			: StatusCodes.INTERNAL_SERVER_ERROR;

	res.status(code).json({
		success: false,
		message: err?.message || "An unhandled error occurred.",
		...(err?.errors?.length ? { errors: err.errors } : {}),
		moreInfo: err?.moreInfo || "No additional info found.",
	});
};

/**
 * Handles MongoDB errors and sends appropriate responses
 * @param res - Express response object
 * @param error - Error object
 */
const handleMongoError = (res: Response, error: MongoServerError): void => {
	switch (error.code) {
		case 11000:
			// Duplicate key error
			generateErrorResponse(res, {
				code: StatusCodes.CONFLICT,
				message: "Duplicate key error: Resource already exists",
				moreInfo: error,
			});
			break;
		case 121:
			// Document validation error
			generateErrorResponse(res, {
				code: StatusCodes.BAD_REQUEST,
				message: "Document validation error",
				moreInfo: error,
			});
			break;
		// Add other MongoDB error codes as needed
		default:
			// Generic MongoDB error
			generateErrorResponse(res, {
				code: StatusCodes.INTERNAL_SERVER_ERROR,
				message: "An internal MongoDB error occurred",
				moreInfo: error,
			});
			break;
	}
};

/**
 * Fallback for anything that isn't a MongoServerError or AppError — logs it, then tries
 * to build a response from it. If even that throws (e.g. a non-serializable error shape),
 * falls back to a generic 500 rather than letting the error handler itself crash.
 * @param res - Express response object
 * @param err - Error object
 */
const handleUnknownError = (res: Response, err: unknown): void => {
	if (NODE_ENV !== NodeENVEnums.TEST) logger.error(err);
	try {
		generateErrorResponse(res, err as ErrorResponse);
	} catch (error: unknown) {
		console.error(error);
		generateErrorResponse(res, {
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message: error instanceof Error ? error.message : "An unknown error occurred.",
			moreInfo: "An error occurred while handling another error.",
		});
	}
};

/**
 * Handles error by printing to console in development env and builds and sends an error response
 * @param res - Express response object
 * @param err - Error object
 */
const handleError = (res: Response, err: unknown): void => {
	if (err instanceof MongoServerError) {
		if (NODE_ENV !== NodeENVEnums.TEST) logger.error(err);
		handleMongoError(res, err);
	} else if (err instanceof AppError) {
		// 4xx errors are client mistakes — log at warn, not error
		if (NODE_ENV !== NodeENVEnums.TEST) {
			err.code >= 500 ? logger.error(err) : logger.warn(err.message);
		}
		generateErrorResponse(res, err);
	} else {
		handleUnknownError(res, err);
	}
};

export { generateErrorResponse, handleError };
