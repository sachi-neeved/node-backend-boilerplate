import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "../lib/utils/auth.utils";
import { AppError } from "../lib/utils/buildError";
import { StatusCodes } from "../lib/utils/statusCodes";
import type UserRepository from "../repositories/userRepository";
import AuthService from "./authServices";

function createMockUserRepository(overrides: Partial<UserRepository> = {}): UserRepository {
	return {
		findOne: vi.fn(),
		findOneWithPassword: vi.fn(),
		findOneAndUpdate: vi.fn(),
		create: vi.fn(),
		...overrides,
	} as unknown as UserRepository;
}

async function rejectsWithCode(promise: Promise<unknown>, code: StatusCodes) {
	await expect(promise).rejects.toBeInstanceOf(AppError);
	await expect(promise).rejects.toMatchObject({ code });
}

describe("AuthService.register", () => {
	it("rejects with CONFLICT when a verified user already exists", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ email: "a@b.com", isVerified: true }),
		});
		const service = new AuthService(userRepository);

		const result = service.register("a@b.com", "password123", "Ada");

		await expect(result).rejects.toBeInstanceOf(AppError);
		await expect(result).rejects.toMatchObject({ code: StatusCodes.CONFLICT });
		expect(userRepository.create).not.toHaveBeenCalled();
		expect(userRepository.findOneAndUpdate).not.toHaveBeenCalled();
	});

	it("creates a new user and returns an OTP when none exists yet", async () => {
		const created = { email: "new@b.com", firstName: "New", isVerified: false };
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue(null),
			create: vi.fn().mockResolvedValue(created),
		});
		const service = new AuthService(userRepository);

		const result = await service.register("new@b.com", "password123", "New");

		expect(userRepository.create).toHaveBeenCalledOnce();
		expect(result).toMatchObject({ user: created, otp: expect.stringMatching(/^\d{6}$/) });
	});
});

describe("AuthService.login", () => {
	it("rejects with UNAUTHORIZED when no user matches the email", async () => {
		const userRepository = createMockUserRepository({
			findOneWithPassword: vi.fn().mockResolvedValue(null),
		});
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.login("a@b.com", "password123"), StatusCodes.UNAUTHORIZED);
	});

	it("rejects with UNAUTHORIZED when the password doesn't match", async () => {
		const userRepository = createMockUserRepository({
			findOneWithPassword: vi.fn().mockResolvedValue({
				password: await hashPassword("correct-password"),
				isVerified: true,
			}),
		});
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.login("a@b.com", "wrong-password"), StatusCodes.UNAUTHORIZED);
	});

	it("rejects with FORBIDDEN when the email isn't verified yet", async () => {
		const userRepository = createMockUserRepository({
			findOneWithPassword: vi.fn().mockResolvedValue({
				password: await hashPassword("password123"),
				isVerified: false,
			}),
		});
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.login("a@b.com", "password123"), StatusCodes.FORBIDDEN);
	});

	it("resolves the user when credentials are valid and the email is verified", async () => {
		const user = {
			email: "a@b.com",
			password: await hashPassword("password123"),
			isVerified: true,
		};
		const userRepository = createMockUserRepository({
			findOneWithPassword: vi.fn().mockResolvedValue(user),
		});
		const service = new AuthService(userRepository);

		await expect(service.login("a@b.com", "password123")).resolves.toBe(user);
	});
});

describe("AuthService.verifyOtp", () => {
	it("rejects with NOT_FOUND when no user matches the email", async () => {
		const userRepository = createMockUserRepository({ findOne: vi.fn().mockResolvedValue(null) });
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.verifyOtp("a@b.com", "123456"), StatusCodes.NOT_FOUND);
	});

	it("rejects with CONFLICT when the user is already verified", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ isVerified: true }),
		});
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.verifyOtp("a@b.com", "123456"), StatusCodes.CONFLICT);
	});

	it("rejects with BAD_REQUEST when the OTP has expired", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({
				isVerified: false,
				otp: await hashPassword("123456"),
				otpExpiry: new Date(Date.now() - 1000),
			}),
		});
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.verifyOtp("a@b.com", "123456"), StatusCodes.BAD_REQUEST);
	});

	it("rejects with BAD_REQUEST when the OTP doesn't match", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({
				isVerified: false,
				otp: await hashPassword("123456"),
				otpExpiry: new Date(Date.now() + 60_000),
			}),
		});
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.verifyOtp("a@b.com", "000000"), StatusCodes.BAD_REQUEST);
	});

	it("marks the user verified and clears the OTP fields on success", async () => {
		const email = "a@b.com";
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({
				email,
				isVerified: false,
				otp: await hashPassword("123456"),
				otpExpiry: new Date(Date.now() + 60_000),
			}),
		});
		const service = new AuthService(userRepository);

		await service.verifyOtp(email, "123456");

		expect(userRepository.findOneAndUpdate).toHaveBeenCalledWith(
			{ email },
			{ isVerified: true, $unset: { otp: 1, otpExpiry: 1 } },
		);
	});
});

describe("AuthService.resendOtp", () => {
	it("rejects with NOT_FOUND when no user matches the email", async () => {
		const userRepository = createMockUserRepository({ findOne: vi.fn().mockResolvedValue(null) });
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.resendOtp("a@b.com"), StatusCodes.NOT_FOUND);
	});

	it("rejects with CONFLICT when the user is already verified", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ isVerified: true }),
		});
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.resendOtp("a@b.com"), StatusCodes.CONFLICT);
	});

	it("rejects with TOO_MANY_REQUESTS when the last OTP was issued under a minute ago", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({
				isVerified: false,
				// 10-minute OTP lifetime, 9.5 minutes left => issued ~30s ago
				otpExpiry: new Date(Date.now() + 9.5 * 60 * 1000),
			}),
		});
		const service = new AuthService(userRepository);

		await rejectsWithCode(service.resendOtp("a@b.com"), StatusCodes.TOO_MANY_REQUESTS);
		expect(userRepository.findOneAndUpdate).not.toHaveBeenCalled();
	});

	it("issues a fresh OTP when the previous one is old enough", async () => {
		const email = "a@b.com";
		const updated = { email, isVerified: false };
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({
				email,
				isVerified: false,
				otpExpiry: new Date(Date.now() + 2 * 60 * 1000),
			}),
			findOneAndUpdate: vi.fn().mockResolvedValue(updated),
		});
		const service = new AuthService(userRepository);

		const result = await service.resendOtp(email);

		expect(userRepository.findOneAndUpdate).toHaveBeenCalledOnce();
		expect(result).toMatchObject({ user: updated, otp: expect.stringMatching(/^\d{6}$/) });
	});
});
