import type { Response } from "express";
import { MongoServerError } from "mongodb";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FieldError } from "../../types";
import { AppError } from "../utils/buildError";
import { StatusCodes } from "../utils/statusCodes";
import { generateErrorResponse, handleError } from "./handleError";

const loggerMock = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

// NODE_ENV is "test" while running under Vitest, which would skip every logging
// branch below — mock it to a non-test value so those branches are exercised.
vi.mock("../logger", () => ({ default: loggerMock }));
vi.mock("../constants", () => ({ NODE_ENV: "production" }));

const createMockResponse = (): Response =>
	({
		status: vi.fn().mockReturnThis(),
		json: vi.fn(),
	}) as unknown as Response;

afterEach(() => {
	vi.clearAllMocks();
});

describe("generateErrorResponse", () => {
	it("uses the given numeric code and message", () => {
		const res = createMockResponse();

		generateErrorResponse(res, { code: StatusCodes.BAD_REQUEST, message: "Bad input" });

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Bad input",
			moreInfo: "No additional info found.",
		});
	});

	it("falls back to 500 when the code is out of the valid HTTP range", () => {
		const res = createMockResponse();

		generateErrorResponse(res, { code: 999, message: "Whatever" });

		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
	});

	it("falls back to a default message when none is provided", () => {
		const res = createMockResponse();

		generateErrorResponse(res, {});

		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ message: "An unhandled error occurred." }),
		);
	});

	it("includes the errors array only when it is non-empty", () => {
		const res = createMockResponse();
		const errors: FieldError[] = [{ field: "email", message: "required" }];

		generateErrorResponse(res, { code: 400, message: "Invalid", errors });

		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors }));
	});

	it("omits the errors key when the array is empty", () => {
		const res = createMockResponse();

		generateErrorResponse(res, { code: 400, message: "Invalid", errors: [] });

		const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(payload).not.toHaveProperty("errors");
	});

	it("passes through a custom moreInfo value", () => {
		const res = createMockResponse();

		generateErrorResponse(res, { code: 400, message: "x", moreInfo: "extra context" });

		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ moreInfo: "extra context" }));
	});
});

describe("handleError — MongoServerError", () => {
	it("maps a duplicate key error (11000) to 409 and logs it", () => {
		const res = createMockResponse();
		const error = new MongoServerError({ message: "dup", code: 11000 });

		handleError(res, error);

		expect(loggerMock.error).toHaveBeenCalledWith(error);
		expect(res.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ message: "Duplicate key error: Resource already exists" }),
		);
	});

	it("maps a document validation error (121) to 400", () => {
		const res = createMockResponse();
		const error = new MongoServerError({ message: "invalid doc", code: 121 });

		handleError(res, error);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
	});

	it("maps any other Mongo error code to a generic 500", () => {
		const res = createMockResponse();
		const error = new MongoServerError({ message: "boom", code: 99999 });

		handleError(res, error);

		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ message: "An internal MongoDB error occurred" }),
		);
	});
});

describe("handleError — AppError", () => {
	it("logs at error level and responds with the error's own code for 5xx", () => {
		const res = createMockResponse();
		const error = new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "boom");

		handleError(res, error);

		expect(loggerMock.error).toHaveBeenCalledWith(error);
		expect(loggerMock.warn).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "boom" }));
	});

	it("logs at warn level (not error) for 4xx client errors", () => {
		const res = createMockResponse();
		const error = new AppError(StatusCodes.BAD_REQUEST, "invalid input");

		handleError(res, error);

		expect(loggerMock.warn).toHaveBeenCalledWith("invalid input");
		expect(loggerMock.error).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
	});

	it("includes field errors carried on the AppError", () => {
		const res = createMockResponse();
		const errors: FieldError[] = [{ field: "email", message: "required" }];
		const error = new AppError(StatusCodes.BAD_REQUEST, "invalid", errors);

		handleError(res, error);

		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors }));
	});
});

describe("handleError — unknown errors", () => {
	it("logs and responds using the message of a plain Error", () => {
		const res = createMockResponse();
		const error = new Error("something broke");

		handleError(res, error);

		expect(loggerMock.error).toHaveBeenCalledWith(error);
		expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "something broke" }));
	});

	it("falls back to the default message for a non-Error thrown value", () => {
		const res = createMockResponse();

		handleError(res, "just a string");

		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ message: "An unhandled error occurred." }),
		);
	});

	it("falls back to a safe 500 response if building the response itself throws", () => {
		const res = createMockResponse();
		(res.status as ReturnType<typeof vi.fn>)
			.mockImplementationOnce(() => {
				throw new Error("status blew up");
			})
			.mockReturnValue(res);
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

		handleError(res, new Error("original error"));

		expect(consoleErrorSpy).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledTimes(2);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "status blew up",
				moreInfo: "An error occurred while handling another error.",
			}),
		);

		consoleErrorSpy.mockRestore();
	});
});
