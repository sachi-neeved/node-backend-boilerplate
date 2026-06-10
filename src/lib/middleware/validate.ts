import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/buildError";
import { StatusCodes } from "../utils/statusCodes";

/**
 * Middleware factory that validates request body, params, and query against a Zod schema.
 * Parsed and coerced values are written back onto the request object.
 * Calls next() with a 400 error object if validation fails.
 *
 * @param schema - A Zod schema whose top-level keys are body, params, and/or query.
 * @returns An Express middleware function.
 */
export function validate(schema: ZodType) {
	return (req: Request, _res: Response, next: NextFunction) => {
		const result = schema.safeParse({
			body: req.body,
			params: req.params,
			query: req.query,
		});

		if (!result.success) {
			const errors = result.error.issues.map((issue) => ({
				field: issue.path.slice(1).join(".") || issue.path.join("."),
				message: issue.message,
			}));
			return next(new AppError(StatusCodes.BAD_REQUEST, "Validation failed", errors));
		}

		const data = result.data as { body?: unknown; params?: unknown; query?: unknown };
		req.body = data.body ?? req.body;
		req.params = (data.params as typeof req.params) ?? req.params;
		Object.defineProperty(req, "query", {
			value: data.query ?? req.query,
			writable: true,
			configurable: true,
		});

		next();
	};
}
