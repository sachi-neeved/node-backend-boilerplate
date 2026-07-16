import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { CookieName } from "../config/cookie";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../lib/constants";
import UserMessages from "../lib/messages/user";
import { AppError } from "../lib/utils/buildError";
import { StatusCodes } from "../lib/utils/statusCodes";
import type AuthService from "../services/authServices";
import type MailService from "../services/mailService";
import AuthController from "./authController";

function createResponse(locals: Record<string, unknown> = {}): Response {
	return {
		locals,
		cookie: vi.fn(),
		clearCookie: vi.fn(),
		status: vi.fn().mockReturnThis(),
		send: vi.fn(),
	} as unknown as Response;
}

describe("AuthController.login", () => {
	it("sets access/refresh cookies with the configured expiry and returns the user", async () => {
		const fakeUser = { _id: "user-id", email: "a@b.com", firstName: "Ada" };
		const authServices = {
			login: vi.fn().mockResolvedValue(fakeUser),
			createAccessToken: vi.fn().mockResolvedValue("access-token"),
			createRefreshToken: vi.fn().mockResolvedValue("refresh-token"),
		} as unknown as AuthService;
		const mailService = {} as MailService;

		const req = { body: { email: "a@b.com", password: "pw" } } as unknown as Request;
		const res = {
			cookie: vi.fn(),
			status: vi.fn().mockReturnThis(),
			send: vi.fn(),
		} as unknown as Response;
		const next = vi.fn() as NextFunction;

		const controller = new AuthController(authServices, mailService);
		controller.login(req, res, next);

		// `login` is wrapped in asyncHandler, which doesn't return its inner promise —
		// wait for the fire-and-forget async work to land instead of awaiting the call itself.
		await vi.waitFor(() => expect(res.send).toHaveBeenCalled());

		expect(res.cookie).toHaveBeenCalledWith(
			CookieName.AccessToken,
			"access-token",
			expect.objectContaining({ maxAge: ACCESS_TOKEN_EXPIRY * 1000 }),
		);
		expect(res.cookie).toHaveBeenCalledWith(
			CookieName.RefreshToken,
			"refresh-token",
			expect.objectContaining({ maxAge: REFRESH_TOKEN_EXPIRY * 1000 }),
		);
		expect(res.send).toHaveBeenCalledWith({ success: true, response: { user: fakeUser } });
		expect(next).not.toHaveBeenCalled();
	});
});

describe("AuthController.refresh", () => {
	it("rejects when there's no refresh token cookie", async () => {
		const authServices = { refreshAccessToken: vi.fn() } as unknown as AuthService;
		const req = { cookies: {} } as unknown as Request;
		const res = { cookie: vi.fn(), send: vi.fn() } as unknown as Response;
		const next = vi.fn() as NextFunction;

		const controller = new AuthController(authServices, {} as MailService);
		controller.refresh(req, res, next);

		await vi.waitFor(() => expect(next).toHaveBeenCalled());
		expect(authServices.refreshAccessToken).not.toHaveBeenCalled();
	});

	it("sets a new access-token cookie from a valid refresh token", async () => {
		const authServices = {
			refreshAccessToken: vi.fn().mockResolvedValue("new-access-token"),
		} as unknown as AuthService;
		const req = {
			cookies: { [CookieName.RefreshToken]: "old-refresh-token" },
		} as unknown as Request;
		const res = {
			cookie: vi.fn(),
			status: vi.fn().mockReturnThis(),
			send: vi.fn(),
		} as unknown as Response;
		const next = vi.fn() as NextFunction;

		const controller = new AuthController(authServices, {} as MailService);
		controller.refresh(req, res, next);

		await vi.waitFor(() => expect(res.send).toHaveBeenCalled());
		expect(authServices.refreshAccessToken).toHaveBeenCalledWith("old-refresh-token");
		expect(res.cookie).toHaveBeenCalledWith(
			CookieName.AccessToken,
			"new-access-token",
			expect.objectContaining({ maxAge: ACCESS_TOKEN_EXPIRY * 1000 }),
		);
	});
});

describe("AuthController.logout", () => {
	it("revokes the session and clears both cookies when a refresh token is present", async () => {
		const authServices = {
			revokeSession: vi.fn().mockResolvedValue(undefined),
		} as unknown as AuthService;
		const req = {
			cookies: { [CookieName.RefreshToken]: "some-refresh-token" },
		} as unknown as Request;
		const res = {
			clearCookie: vi.fn(),
			status: vi.fn().mockReturnThis(),
			send: vi.fn(),
		} as unknown as Response;
		const next = vi.fn() as NextFunction;

		const controller = new AuthController(authServices, {} as MailService);
		controller.logout(req, res, next);

		await vi.waitFor(() => expect(res.send).toHaveBeenCalled());
		expect(authServices.revokeSession).toHaveBeenCalledWith("some-refresh-token");
		expect(res.clearCookie).toHaveBeenCalledWith(CookieName.AccessToken, expect.anything());
		expect(res.clearCookie).toHaveBeenCalledWith(CookieName.RefreshToken, expect.anything());
	});

	it("still clears cookies when there's no refresh token to revoke", async () => {
		const authServices = { revokeSession: vi.fn() } as unknown as AuthService;
		const req = { cookies: {} } as unknown as Request;
		const res = {
			clearCookie: vi.fn(),
			status: vi.fn().mockReturnThis(),
			send: vi.fn(),
		} as unknown as Response;
		const next = vi.fn() as NextFunction;

		const controller = new AuthController(authServices, {} as MailService);
		controller.logout(req, res, next);

		await vi.waitFor(() => expect(res.send).toHaveBeenCalled());
		expect(authServices.revokeSession).not.toHaveBeenCalled();
		expect(res.clearCookie).toHaveBeenCalledTimes(2);
	});
});

describe("AuthController.resendOtp", () => {
	it("emails the new OTP and responds with the resent message", async () => {
		const fakeUser = { email: "a@b.com", firstName: "Ada" };
		const authServices = {
			resendOtp: vi.fn().mockResolvedValue({ otp: "123456", user: fakeUser }),
		} as unknown as AuthService;
		const mailService = {
			sendOtpEmail: vi.fn().mockResolvedValue(undefined),
		} as unknown as MailService;
		const req = { body: { email: "a@b.com" } } as unknown as Request;
		const res = createResponse();
		const next = vi.fn() as NextFunction;

		const controller = new AuthController(authServices, mailService);
		controller.resendOtp(req, res, next);

		await vi.waitFor(() => expect(res.send).toHaveBeenCalled());
		expect(mailService.sendOtpEmail).toHaveBeenCalledWith("a@b.com", "Ada", "123456");
		expect(res.send).toHaveBeenCalledWith({
			success: true,
			response: { message: UserMessages.OTP_RESENT },
		});
	});
});

describe("AuthController.getProfile", () => {
	it("rejects with UNAUTHORIZED when no authenticated user is set on the response", async () => {
		const authServices = { findLoggedInUser: vi.fn() } as unknown as AuthService;
		const req = {} as Request;
		const res = createResponse(); // no `user` in locals
		const next = vi.fn() as NextFunction;

		new AuthController(authServices, {} as MailService).getProfile(req, res, next);

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

		new AuthController(authServices, {} as MailService).getProfile(req, res, next);

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

		new AuthController(authServices, {} as MailService).getProfile(req, res, next);

		await vi.waitFor(() => expect(res.send).toHaveBeenCalled());
		expect(res.send).toHaveBeenCalledWith({ success: true, response: { user } });
		expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
	});
});
