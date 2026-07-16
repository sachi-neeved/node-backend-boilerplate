import { createHash, randomInt } from "node:crypto";
import type { Request } from "express";
import type { Types } from "mongoose";
import buildError from "@/lib/utils/buildError";
import OtpRepository from "@/repositories/otpRepository";
import RoleRepository from "@/repositories/roleRepository";
import SessionRepository from "@/repositories/sessionRepository";
import UserRepository from "@/repositories/userRepository";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../lib/constants";
import UserMessages from "../lib/messages/user";
import { comparePassword, hashPassword } from "../lib/utils/auth.utils";
import { StatusCodes } from "../lib/utils/statusCodes";
import type { RoleDocument } from "../models/Role";
import type { UserDocument } from "../models/User";
import type { JwtPayload, JwtSubject } from "../types";
import JWTServices from "./jwtServices";

/** Uses crypto.randomInt (not Math.random()) — an OTP is a security control, not just a display value. */
function generateOtp(): string {
	return randomInt(100_000, 1_000_000).toString();
}

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

/**
 * AuthService provides all authentication-related business logic: registration,
 * OTP verification, login, token creation, and session management.
 */
class AuthService {
	constructor(
		private readonly userRepository: UserRepository = new UserRepository(),
		private readonly roleRepository: RoleRepository = new RoleRepository(),
		private readonly sessionRepository: SessionRepository = new SessionRepository(),
		private readonly otpRepository: OtpRepository = new OtpRepository(),
	) {}

	/**
	 * Registers a new user with email and password.
	 * Creates the user (with the default "user" role) and issues a fresh OTP.
	 * If an unverified account already exists for the email, a new OTP is issued
	 * without creating a duplicate user document.
	 *
	 * @param email - The user's email address.
	 * @param password - The plain-text password to hash and store.
	 * @param firstName - The user's first name.
	 * @param lastName - The user's last name (optional).
	 * @returns `{ user, otp }` on success, or throws an AppError if the email is already verified.
	 */
	async register(email: string, password: string, firstName: string, lastName?: string) {
		const existing = await this.userRepository.findOne({ email: email.toLowerCase() });
		if (existing?.isVerified) {
			return buildError(StatusCodes.CONFLICT, UserMessages.USER_ALREADY_EXISTS);
		}

		const userRole = await this.roleRepository.findByName("user");
		if (!userRole) {
			return buildError(StatusCodes.INTERNAL_SERVER_ERROR, "Default role not seeded");
		}

		let user: UserDocument;
		if (existing) {
			user = existing;
		} else {
			const hashed = await hashPassword(password);
			user = await this.userRepository.create({
				email: email.toLowerCase(),
				password: hashed,
				firstName,
				lastName,
				roleId: userRole._id,
				isVerified: false,
				isActive: true,
			});
		}

		// Invalidate any prior OTPs for this email+purpose before issuing a new one
		await this.otpRepository.invalidateAll(user.email, "registration");

		const otp = generateOtp();
		const otpHash = await hashPassword(otp);
		await this.otpRepository.create({
			email: user.email,
			otpHash,
			purpose: "registration",
			expiresAt: new Date(Date.now() + 10 * 60 * 1000),
			used: false,
		});

		return { user, otp };
	}

	/**
	 * Verifies a registration OTP and activates the user account.
	 * Marks the OTP document as used so it cannot be replayed.
	 *
	 * @param email - The user's email address.
	 * @param otp - The 6-digit OTP supplied by the user.
	 * @returns The updated, verified user document, or throws an AppError on failure.
	 */
	async verifyOtp(email: string, otp: string) {
		const user = await this.userRepository.findOne({ email: email.toLowerCase() });
		if (!user) return buildError(StatusCodes.NOT_FOUND, UserMessages.USER_NOT_FOUND);
		if (user.isVerified) return buildError(StatusCodes.CONFLICT, UserMessages.ALREADY_VERIFIED);

		const record = await this.otpRepository.findLatest(email.toLowerCase(), "registration");
		if (!record || record.expiresAt < new Date()) {
			return buildError(StatusCodes.BAD_REQUEST, UserMessages.OTP_INVALID);
		}
		const valid = await comparePassword(otp, record.otpHash);
		if (!valid) return buildError(StatusCodes.BAD_REQUEST, UserMessages.OTP_INVALID);

		await this.otpRepository.markUsed(record._id);
		return (await this.userRepository.findOneAndUpdate(
			{ email: user.email },
			{ isVerified: true },
		)) as UserDocument;
	}

	/**
	 * Re-sends a registration OTP.
	 * Rate-limited: blocked if the current OTP was issued less than 1 minute ago
	 * (i.e. its expiry is still more than 9 minutes away).
	 *
	 * @param email - The user's email address.
	 * @returns `{ user, otp }` on success, or throws an AppError.
	 */
	async resendOtp(email: string) {
		const user = await this.userRepository.findOne({ email: email.toLowerCase() });
		if (!user) return buildError(StatusCodes.NOT_FOUND, UserMessages.USER_NOT_FOUND);
		if (user.isVerified) return buildError(StatusCodes.CONFLICT, UserMessages.ALREADY_VERIFIED);

		const existing = await this.otpRepository.findLatest(email.toLowerCase(), "registration");
		if (existing && existing.expiresAt.getTime() - Date.now() > 9 * 60 * 1000) {
			return buildError(StatusCodes.TOO_MANY_REQUESTS, UserMessages.OTP_RESEND_TOO_SOON);
		}

		await this.otpRepository.invalidateAll(user.email, "registration");

		const otp = generateOtp();
		const otpHash = await hashPassword(otp);
		await this.otpRepository.create({
			email: user.email,
			otpHash,
			purpose: "registration",
			expiresAt: new Date(Date.now() + 10 * 60 * 1000),
			used: false,
		});

		return { user, otp };
	}

	/**
	 * Validates a user's email and password credentials.
	 * Returns the populated user document (including role) on success.
	 *
	 * @param email - The user's email address.
	 * @param password - The plain-text password to verify.
	 * @returns The authenticated user document, or throws an AppError.
	 */
	async login(email: string, password: string) {
		const user = await this.userRepository.findOneWithPassword({ email: email.toLowerCase() });
		if (!user) return buildError(StatusCodes.UNAUTHORIZED, UserMessages.INVALID_CREDENTIALS);

		const valid = await comparePassword(password, user.password);
		if (!valid) return buildError(StatusCodes.UNAUTHORIZED, UserMessages.INVALID_CREDENTIALS);
		if (!user.isVerified) return buildError(StatusCodes.FORBIDDEN, UserMessages.EMAIL_NOT_VERIFIED);
		if (!user.isActive) return buildError(StatusCodes.FORBIDDEN, UserMessages.USER_NOT_FOUND);

		return user;
	}

	/**
	 * Builds the JWT subject payload from a role-populated user document.
	 * Requires `roleId` to be populated (i.e. a RoleDocument, not just an ObjectId) —
	 * both `findOneWithPassword` and `findByIdWithRole` on UserRepository do this.
	 *
	 * @param user - A user document with `roleId` populated.
	 * @returns A `JwtSubject` containing id, email, firstName, role name, and permissions.
	 */
	private buildJwtSubject(user: UserDocument): JwtSubject {
		const role = user.roleId as unknown as RoleDocument;
		return {
			id: user._id,
			email: user.email,
			firstName: user.firstName,
			role: role.name,
			permissions: role.permissions,
		};
	}

	/**
	 * Creates a short-lived access token (JWT) for the given user.
	 *
	 * @param user - A user document with `roleId` populated.
	 * @returns A signed JWT access token string.
	 */
	async createAccessToken(user: UserDocument): Promise<string> {
		const payload: JwtPayload = { sub: this.buildJwtSubject(user) };
		return JWTServices.generateToken(payload, {
			expiresIn: ACCESS_TOKEN_EXPIRY,
			algorithm: "HS256",
		});
	}

	/**
	 * Creates a long-lived refresh token (JWT) and persists its SHA-256 hash
	 * as a Session document so it can be revoked server-side.
	 *
	 * @param user - A user document with `roleId` populated.
	 * @param req - Optional Express request used to record userAgent and IP.
	 * @returns The raw refresh JWT string.
	 */
	async createRefreshToken(user: UserDocument, req?: Request): Promise<string> {
		const payload: JwtPayload = { sub: this.buildJwtSubject(user) };
		const token = JWTServices.generateToken(payload, {
			expiresIn: REFRESH_TOKEN_EXPIRY,
			algorithm: "HS256",
		});

		await this.sessionRepository.create({
			userId: user._id,
			tokenHash: hashToken(token),
			userAgent: req?.headers["user-agent"],
			ip: req?.ip,
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
			isRevoked: false,
		});

		return token;
	}

	/**
	 * Issues a new access token by validating the refresh token against the
	 * stored Session document. Throws if the session is revoked, expired, or
	 * the associated user is inactive.
	 *
	 * @param refreshToken - The raw refresh JWT string from the cookie.
	 * @returns A new signed access token string.
	 */
	async refreshAccessToken(refreshToken: string): Promise<string> {
		const session = await this.sessionRepository.findByTokenHash(hashToken(refreshToken));
		if (!session || session.expiresAt < new Date()) {
			return buildError(StatusCodes.UNAUTHORIZED, UserMessages.USER_INVALID_SESSION);
		}

		const user = await this.userRepository.findByIdWithRole(session.userId);
		if (!user?.isActive) {
			return buildError(StatusCodes.UNAUTHORIZED, UserMessages.USER_INVALID_SESSION);
		}

		return this.createAccessToken(user);
	}

	/**
	 * Revokes a single session identified by the raw refresh token. Called on
	 * logout to invalidate the token server-side.
	 *
	 * @param refreshToken - The raw refresh JWT string from the cookie.
	 */
	async revokeSession(refreshToken: string): Promise<void> {
		await this.sessionRepository.revokeByTokenHash(hashToken(refreshToken));
	}

	/**
	 * Revokes all active sessions for a user — equivalent to "logout everywhere".
	 *
	 * @param userId - The MongoDB ObjectId of the user.
	 */
	async revokeAllSessions(userId: Types.ObjectId): Promise<void> {
		await this.sessionRepository.revokeAllForUser(userId);
	}

	/**
	 * Finds a logged-in user by their ID, with the role document populated.
	 *
	 * @param id - The MongoDB ObjectId of the user.
	 * @returns The role-populated user document, or null if not found.
	 */
	async findLoggedInUser(id: Types.ObjectId): Promise<UserDocument | null> {
		return this.userRepository.findByIdWithRole(id);
	}
}

export default AuthService;
