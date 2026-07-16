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
import { DEFAULT_ROLES, RoleModel, UserModel } from "../src/models";
import MailService from "../src/services/mailService";

const app = createApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	await mongoose.connect(mongo.getUri());
	// register() looks up the "user" role — this test manages its own Mongo connection
	// independent of inItDb(), so it has to seed the same DEFAULT_ROLES itself.
	await Promise.all(
		DEFAULT_ROLES.map((role) =>
			RoleModel.findOneAndUpdate({ name: role.name }, { $setOnInsert: role }, { upsert: true }),
		),
	);
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

/** Registers, captures the mocked OTP email, and verifies a new user. Leaves them ready to log in. */
async function registerAndVerify(email: string, password: string, firstName = "Ada") {
	const registerRes = await request(app)
		.post("/api/v1/auth/register")
		.send({ email, password, firstName });
	if (registerRes.status !== 200) return registerRes;

	const calls = vi.mocked(MailService.prototype.sendOtpEmail).mock.calls;
	const otp = calls[calls.length - 1]?.[2];
	return request(app).post("/api/v1/auth/verify-otp").send({ email, otp });
}

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

	it("rejects registering the same email again once it's already verified", async () => {
		const email = "dup@example.com";
		const password = "password123";
		await registerAndVerify(email, password);

		const secondAttempt = await request(app)
			.post("/api/v1/auth/register")
			.send({ email, password, firstName: "Ada" });

		expect(secondAttempt.status).toBe(409);
	});

	it("rejects login with the wrong password", async () => {
		const email = "wrongpw@example.com";
		await registerAndVerify(email, "correct-password");

		const loginRes = await request(app)
			.post("/api/v1/auth/login")
			.send({ email, password: "wrong-password" });

		expect(loginRes.status).toBe(401);
	});
});

describe("Session lifecycle: login -> refresh -> logout -> refresh rejected", () => {
	it("actually revokes the refresh token server-side on logout", async () => {
		const email = "sessions@example.com";
		const password = "password123";
		await registerAndVerify(email, password);

		const loginRes = await request(app).post("/api/v1/auth/login").send({ email, password });
		const loginCookies = loginRes.get("Set-Cookie") ?? [];
		expect(loginCookies.length).toBeGreaterThan(0);

		// Refresh while the session is still valid — should issue a new access token.
		const refreshRes = await request(app).post("/api/v1/auth/refresh").set("Cookie", loginCookies);
		expect(refreshRes.status).toBe(200);
		expect((refreshRes.get("Set-Cookie") ?? []).some((c) => c.startsWith("access_token="))).toBe(
			true,
		);

		// Logout revokes the session tied to the refresh token.
		const logoutRes = await request(app).post("/api/v1/auth/logout").set("Cookie", loginCookies);
		expect(logoutRes.status).toBe(200);

		// The same refresh token must no longer work — this is the whole point of server-side
		// session tracking over plain stateless JWTs.
		const refreshAfterLogout = await request(app)
			.post("/api/v1/auth/refresh")
			.set("Cookie", loginCookies);
		expect(refreshAfterLogout.status).toBe(401);
	});
});
