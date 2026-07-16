// This test imports createApp() directly and runs it in-process (no real server/port).
// That only works because routes/index.ts, routes/v1|v2/index.ts, and lib/swagger/index.ts
// use static imports to wire things up. If any of those go back to the old
// fs.readdirSync + require(runtimeComputedPath) dynamic-discovery pattern, this test will
// fail with "Cannot find module ..." — Vitest's module loader can't resolve a require()
// call whose path is only known at runtime, even though ts-node handles it fine.
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/mailService");

import { createApp } from "../src/index";
import { UserModel } from "../src/models";
import MailService from "../src/services/mailService";

const app = createApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	await mongoose.connect(mongo.getUri());
}, 60_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongo.stop();
});

beforeEach(async () => {
	await UserModel.deleteMany({});
	vi.mocked(MailService.prototype.sendOtpEmail).mockClear();
	vi.mocked(MailService.prototype.sendWelcomeEmail).mockClear();
});

describe("Auth flow: register -> verify-otp -> login -> /users/me", () => {
	it("takes a new user through the full auth lifecycle", async () => {
		const email = "e2e@example.com";
		const password = "password123";

		const registerRes = await request(app)
			.post("/api/v1/auth/register")
			.send({ email, password, firstName: "Ada" });

		expect(registerRes.status).toBe(200);
		expect(registerRes.body).toMatchObject({
			success: true,
			response: { message: expect.stringContaining("Verification code") },
		});

		// The OTP is bcrypt-hashed in the DB — recover the plaintext from the mocked email send.
		const otp = vi.mocked(MailService.prototype.sendOtpEmail).mock.calls[0][2];
		expect(otp).toMatch(/^\d{6}$/);

		const verifyRes = await request(app).post("/api/v1/auth/verify-otp").send({ email, otp });

		expect(verifyRes.status).toBe(200);
		expect(verifyRes.body.response.user.isVerified).toBe(true);
		expect(MailService.prototype.sendWelcomeEmail).toHaveBeenCalledOnce();

		const loginRes = await request(app).post("/api/v1/auth/login").send({ email, password });

		expect(loginRes.status).toBe(200);
		const cookies = loginRes.get("Set-Cookie") ?? [];
		expect(cookies.some((c) => c.startsWith("access_token="))).toBe(true);
		expect(cookies.some((c) => c.startsWith("refresh_token="))).toBe(true);

		const meRes = await request(app).get("/api/v2/users/me").set("Cookie", cookies);

		expect(meRes.status).toBe(200);
		expect(meRes.body.response.email).toBe(email);
	});
});
