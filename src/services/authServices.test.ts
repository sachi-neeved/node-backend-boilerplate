import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "../lib/utils/auth.utils";
import { AppError } from "../lib/utils/buildError";
import { StatusCodes } from "../lib/utils/statusCodes";
import type OtpRepository from "../repositories/otpRepository";
import type RoleRepository from "../repositories/roleRepository";
import type SessionRepository from "../repositories/sessionRepository";
import type UserRepository from "../repositories/userRepository";
import AuthService from "./authServices";

const USER_ROLE = { _id: "role-id", name: "user", permissions: [] };

function createMockUserRepository(overrides: Partial<UserRepository> = {}): UserRepository {
	return {
		findOne: vi.fn(),
		findOneWithPassword: vi.fn(),
		findByIdWithRole: vi.fn(),
		findOneAndUpdate: vi.fn(),
		create: vi.fn(),
		...overrides,
	} as unknown as UserRepository;
}

function createMockRoleRepository(overrides: Partial<RoleRepository> = {}): RoleRepository {
	return {
		findByName: vi.fn().mockResolvedValue(USER_ROLE),
		...overrides,
	} as unknown as RoleRepository;
}

function createMockSessionRepository(
	overrides: Partial<SessionRepository> = {},
): SessionRepository {
	return {
		create: vi.fn(),
		findByTokenHash: vi.fn(),
		revokeByTokenHash: vi.fn(),
		revokeAllForUser: vi.fn(),
		...overrides,
	} as unknown as SessionRepository;
}

function createMockOtpRepository(overrides: Partial<OtpRepository> = {}): OtpRepository {
	return {
		create: vi.fn(),
		findLatest: vi.fn(),
		markUsed: vi.fn(),
		invalidateAll: vi.fn(),
		...overrides,
	} as unknown as OtpRepository;
}

async function rejectsWithCode(promise: Promise<unknown>, code: StatusCodes) {
	await expect(promise).rejects.toBeInstanceOf(AppError);
	await expect(promise).rejects.toMatchObject({ code });
}

function createService(
	overrides: {
		userRepository?: UserRepository;
		roleRepository?: RoleRepository;
		sessionRepository?: SessionRepository;
		otpRepository?: OtpRepository;
	} = {},
) {
	return new AuthService(
		overrides.userRepository ?? createMockUserRepository(),
		overrides.roleRepository ?? createMockRoleRepository(),
		overrides.sessionRepository ?? createMockSessionRepository(),
		overrides.otpRepository ?? createMockOtpRepository(),
	);
}

describe("AuthService.register", () => {
	it("rejects with CONFLICT when a verified user already exists", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ email: "a@b.com", isVerified: true }),
		});
		const otpRepository = createMockOtpRepository();
		const service = createService({ userRepository, otpRepository });

		const result = service.register("a@b.com", "password123", "Ada");

		await expect(result).rejects.toBeInstanceOf(AppError);
		await expect(result).rejects.toMatchObject({ code: StatusCodes.CONFLICT });
		expect(userRepository.create).not.toHaveBeenCalled();
		expect(otpRepository.create).not.toHaveBeenCalled();
	});

	it("rejects with INTERNAL_SERVER_ERROR when the user role hasn't been seeded", async () => {
		const userRepository = createMockUserRepository({ findOne: vi.fn().mockResolvedValue(null) });
		const roleRepository = createMockRoleRepository({
			findByName: vi.fn().mockResolvedValue(null),
		});
		const service = createService({ userRepository, roleRepository });

		await rejectsWithCode(
			service.register("new@b.com", "password123", "New"),
			StatusCodes.INTERNAL_SERVER_ERROR,
		);
	});

	it("creates a new user with the user role and returns an OTP when none exists yet", async () => {
		const created = { email: "new@b.com", firstName: "New", isVerified: false };
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue(null),
			create: vi.fn().mockResolvedValue(created),
		});
		const otpRepository = createMockOtpRepository();
		const service = createService({ userRepository, otpRepository });

		const result = await service.register("new@b.com", "password123", "New");

		expect(userRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({ email: "new@b.com", roleId: USER_ROLE._id }),
		);
		expect(otpRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({ email: created.email, purpose: "registration" }),
		);
		expect(result).toMatchObject({ user: created, otp: expect.stringMatching(/^\d{6}$/) });
	});

	it("re-issues an OTP without creating a duplicate user for an existing unverified account", async () => {
		const existing = { email: "a@b.com", isVerified: false };
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue(existing),
		});
		const otpRepository = createMockOtpRepository();
		const service = createService({ userRepository, otpRepository });

		const result = await service.register("a@b.com", "password123", "Ada");

		expect(userRepository.create).not.toHaveBeenCalled();
		expect(otpRepository.invalidateAll).toHaveBeenCalledWith(existing.email, "registration");
		expect(result).toMatchObject({ user: existing, otp: expect.stringMatching(/^\d{6}$/) });
	});
});

describe("AuthService.login", () => {
	it("rejects with UNAUTHORIZED when no user matches the email", async () => {
		const userRepository = createMockUserRepository({
			findOneWithPassword: vi.fn().mockResolvedValue(null),
		});
		const service = createService({ userRepository });

		await rejectsWithCode(service.login("a@b.com", "password123"), StatusCodes.UNAUTHORIZED);
	});

	it("rejects with UNAUTHORIZED when the password doesn't match", async () => {
		const userRepository = createMockUserRepository({
			findOneWithPassword: vi.fn().mockResolvedValue({
				password: await hashPassword("correct-password"),
				isVerified: true,
				isActive: true,
			}),
		});
		const service = createService({ userRepository });

		await rejectsWithCode(service.login("a@b.com", "wrong-password"), StatusCodes.UNAUTHORIZED);
	});

	it("rejects with FORBIDDEN when the email isn't verified yet", async () => {
		const userRepository = createMockUserRepository({
			findOneWithPassword: vi.fn().mockResolvedValue({
				password: await hashPassword("password123"),
				isVerified: false,
				isActive: true,
			}),
		});
		const service = createService({ userRepository });

		await rejectsWithCode(service.login("a@b.com", "password123"), StatusCodes.FORBIDDEN);
	});

	it("rejects with FORBIDDEN when the account has been deactivated", async () => {
		const userRepository = createMockUserRepository({
			findOneWithPassword: vi.fn().mockResolvedValue({
				password: await hashPassword("password123"),
				isVerified: true,
				isActive: false,
			}),
		});
		const service = createService({ userRepository });

		await rejectsWithCode(service.login("a@b.com", "password123"), StatusCodes.FORBIDDEN);
	});

	it("resolves the user when credentials are valid, verified, and active", async () => {
		const user = {
			email: "a@b.com",
			password: await hashPassword("password123"),
			isVerified: true,
			isActive: true,
		};
		const userRepository = createMockUserRepository({
			findOneWithPassword: vi.fn().mockResolvedValue(user),
		});
		const service = createService({ userRepository });

		await expect(service.login("a@b.com", "password123")).resolves.toBe(user);
	});
});

describe("AuthService.verifyOtp", () => {
	it("rejects with NOT_FOUND when no user matches the email", async () => {
		const userRepository = createMockUserRepository({ findOne: vi.fn().mockResolvedValue(null) });
		const service = createService({ userRepository });

		await rejectsWithCode(service.verifyOtp("a@b.com", "123456"), StatusCodes.NOT_FOUND);
	});

	it("rejects with CONFLICT when the user is already verified", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ isVerified: true }),
		});
		const service = createService({ userRepository });

		await rejectsWithCode(service.verifyOtp("a@b.com", "123456"), StatusCodes.CONFLICT);
	});

	it("rejects with BAD_REQUEST when the OTP has expired", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ isVerified: false }),
		});
		const otpRepository = createMockOtpRepository({
			findLatest: vi.fn().mockResolvedValue({
				otpHash: await hashPassword("123456"),
				expiresAt: new Date(Date.now() - 1000),
			}),
		});
		const service = createService({ userRepository, otpRepository });

		await rejectsWithCode(service.verifyOtp("a@b.com", "123456"), StatusCodes.BAD_REQUEST);
	});

	it("rejects with BAD_REQUEST when no OTP record exists", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ isVerified: false }),
		});
		const otpRepository = createMockOtpRepository({ findLatest: vi.fn().mockResolvedValue(null) });
		const service = createService({ userRepository, otpRepository });

		await rejectsWithCode(service.verifyOtp("a@b.com", "123456"), StatusCodes.BAD_REQUEST);
	});

	it("rejects with BAD_REQUEST when the OTP doesn't match", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ isVerified: false }),
		});
		const otpRepository = createMockOtpRepository({
			findLatest: vi.fn().mockResolvedValue({
				otpHash: await hashPassword("123456"),
				expiresAt: new Date(Date.now() + 60_000),
			}),
		});
		const service = createService({ userRepository, otpRepository });

		await rejectsWithCode(service.verifyOtp("a@b.com", "000000"), StatusCodes.BAD_REQUEST);
	});

	it("marks the OTP used and the user verified on success", async () => {
		const email = "a@b.com";
		const otpRecord = {
			_id: "otp-id",
			otpHash: await hashPassword("123456"),
			expiresAt: new Date(Date.now() + 60_000),
		};
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ email, isVerified: false }),
		});
		const otpRepository = createMockOtpRepository({
			findLatest: vi.fn().mockResolvedValue(otpRecord),
		});
		const service = createService({ userRepository, otpRepository });

		await service.verifyOtp(email, "123456");

		expect(otpRepository.markUsed).toHaveBeenCalledWith(otpRecord._id);
		expect(userRepository.findOneAndUpdate).toHaveBeenCalledWith({ email }, { isVerified: true });
	});
});

describe("AuthService.resendOtp", () => {
	it("rejects with NOT_FOUND when no user matches the email", async () => {
		const userRepository = createMockUserRepository({ findOne: vi.fn().mockResolvedValue(null) });
		const service = createService({ userRepository });

		await rejectsWithCode(service.resendOtp("a@b.com"), StatusCodes.NOT_FOUND);
	});

	it("rejects with CONFLICT when the user is already verified", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ isVerified: true }),
		});
		const service = createService({ userRepository });

		await rejectsWithCode(service.resendOtp("a@b.com"), StatusCodes.CONFLICT);
	});

	it("rejects with TOO_MANY_REQUESTS when the last OTP was issued under a minute ago", async () => {
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ email: "a@b.com", isVerified: false }),
		});
		const otpRepository = createMockOtpRepository({
			// 10-minute OTP lifetime, 9.5 minutes left => issued ~30s ago
			findLatest: vi.fn().mockResolvedValue({ expiresAt: new Date(Date.now() + 9.5 * 60 * 1000) }),
		});
		const service = createService({ userRepository, otpRepository });

		await rejectsWithCode(service.resendOtp("a@b.com"), StatusCodes.TOO_MANY_REQUESTS);
		expect(otpRepository.create).not.toHaveBeenCalled();
	});

	it("issues a fresh OTP when the previous one is old enough", async () => {
		const email = "a@b.com";
		const userRepository = createMockUserRepository({
			findOne: vi.fn().mockResolvedValue({ email, isVerified: false }),
		});
		const otpRepository = createMockOtpRepository({
			findLatest: vi.fn().mockResolvedValue({ expiresAt: new Date(Date.now() + 2 * 60 * 1000) }),
		});
		const service = createService({ userRepository, otpRepository });

		const result = await service.resendOtp(email);

		expect(otpRepository.invalidateAll).toHaveBeenCalledWith(email, "registration");
		expect(otpRepository.create).toHaveBeenCalledOnce();
		expect(result).toMatchObject({
			user: { email, isVerified: false },
			otp: expect.stringMatching(/^\d{6}$/),
		});
	});
});

describe("AuthService.createRefreshToken", () => {
	it("persists a hashed session and returns the raw token", async () => {
		const user = {
			_id: "user-id",
			email: "a@b.com",
			firstName: "Ada",
			roleId: USER_ROLE,
		};
		const sessionRepository = createMockSessionRepository();
		const service = createService({ sessionRepository });

		// biome-ignore lint/suspicious/noExplicitAny: partial UserDocument stand-in for this unit test
		const token = await service.createRefreshToken(user as any);

		expect(typeof token).toBe("string");
		expect(sessionRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({ userId: user._id, isRevoked: false }),
		);
	});
});

describe("AuthService.refreshAccessToken", () => {
	it("rejects with UNAUTHORIZED when no session matches the token", async () => {
		const sessionRepository = createMockSessionRepository({
			findByTokenHash: vi.fn().mockResolvedValue(null),
		});
		const service = createService({ sessionRepository });

		await rejectsWithCode(service.refreshAccessToken("bogus-token"), StatusCodes.UNAUTHORIZED);
	});

	it("rejects with UNAUTHORIZED when the session's user is inactive", async () => {
		const sessionRepository = createMockSessionRepository({
			findByTokenHash: vi.fn().mockResolvedValue({
				userId: "user-id",
				expiresAt: new Date(Date.now() + 60_000),
			}),
		});
		const userRepository = createMockUserRepository({
			findByIdWithRole: vi.fn().mockResolvedValue({ isActive: false }),
		});
		const service = createService({ sessionRepository, userRepository });

		await rejectsWithCode(service.refreshAccessToken("some-token"), StatusCodes.UNAUTHORIZED);
	});

	it("issues a new access token for a valid session", async () => {
		const sessionRepository = createMockSessionRepository({
			findByTokenHash: vi.fn().mockResolvedValue({
				userId: "user-id",
				expiresAt: new Date(Date.now() + 60_000),
			}),
		});
		const userRepository = createMockUserRepository({
			findByIdWithRole: vi.fn().mockResolvedValue({
				_id: "user-id",
				email: "a@b.com",
				firstName: "Ada",
				isActive: true,
				roleId: USER_ROLE,
			}),
		});
		const service = createService({ sessionRepository, userRepository });

		const token = await service.refreshAccessToken("some-token");

		expect(typeof token).toBe("string");
	});
});

describe("AuthService.revokeSession", () => {
	it("revokes the session matching the given refresh token's hash", async () => {
		const sessionRepository = createMockSessionRepository();
		const service = createService({ sessionRepository });

		await service.revokeSession("some-refresh-token");

		expect(sessionRepository.revokeByTokenHash).toHaveBeenCalledOnce();
	});
});
