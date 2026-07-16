import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { CookieName } from "../config/cookie";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../lib/constants";
import type AuthService from "../services/authServices";
import type MailService from "../services/mailService";
import AuthController from "./authController";

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
		const res = { cookie: vi.fn(), send: vi.fn() } as unknown as Response;
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
