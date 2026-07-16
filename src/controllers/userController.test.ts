import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../lib/utils/buildError";
import { StatusCodes } from "../lib/utils/statusCodes";
import type AuthService from "../services/authServices";
import UserController from "./userController";

function createResponse(locals: Record<string, unknown> = {}): Response {
	return {
		locals,
		status: vi.fn().mockReturnThis(),
		send: vi.fn(),
	} as unknown as Response;
}

describe("UserController.getUser", () => {
	it("rejects with UNAUTHORIZED when no authenticated user is set on the response", async () => {
		const authServices = { findLoggedInUser: vi.fn() } as unknown as AuthService;
		const req = {} as Request;
		const res = createResponse(); // no `user` in locals
		const next = vi.fn() as NextFunction;

		new UserController(authServices).getUser(req, res, next);

		await vi.waitFor(() => expect(next).toHaveBeenCalled());
		expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: StatusCodes.UNAUTHORIZED }));
		expect(authServices.findLoggedInUser).not.toHaveBeenCalled();
	});

	it("rejects with NOT_FOUND when the authenticated user no longer exists", async () => {
		const authServices = {
			findLoggedInUser: vi.fn().mockResolvedValue(null),
		} as unknown as AuthService;
		const req = {} as Request;
		const res = createResponse({ user: { id: "user-id" } });
		const next = vi.fn() as NextFunction;

		new UserController(authServices).getUser(req, res, next);

		await vi.waitFor(() => expect(next).toHaveBeenCalled());
		expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: StatusCodes.NOT_FOUND }));
	});

	it("responds with the user when found", async () => {
		const user = { _id: "user-id", email: "a@b.com", firstName: "Ada" };
		const authServices = {
			findLoggedInUser: vi.fn().mockResolvedValue(user),
		} as unknown as AuthService;
		const req = {} as Request;
		const res = createResponse({ user: { id: "user-id" } });
		const next = vi.fn() as NextFunction;

		new UserController(authServices).getUser(req, res, next);

		await vi.waitFor(() => expect(res.send).toHaveBeenCalled());
		expect(res.send).toHaveBeenCalledWith({ success: true, response: user });
		expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
	});
});
