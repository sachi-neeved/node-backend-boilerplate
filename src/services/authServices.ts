import { randomInt } from "node:crypto";
import type { Types } from "mongoose";
import buildError from "@/lib/utils/buildError";
import UserRepository from "@/repositories/userRepository";
import type { JwtPayload, JwtSubject } from "../@types";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../lib/constants";
import UserMessages from "../lib/messages/user";
import { comparePassword, hashPassword } from "../lib/utils/auth.utils";
import { StatusCodes } from "../lib/utils/statusCodes";
import type { UserDocument } from "../models";
import JWTServices from "./jwtServices";

/** Uses crypto.randomInt (not Math.random()) — an OTP is a security control, not just a display value. */
function generateOtp(): string {
	return randomInt(100_000, 1_000_000).toString();
}

/**
 * AuthService provides authentication-related operations, backed by an injected UserRepository.
 */
class AuthService {
	constructor(private readonly userRepository: UserRepository = new UserRepository()) {}

	/**
	 * Registers a new user with email and password.
	 *
	 * @param email - The user's email address.
	 * @param password - The plain-text password to hash and store.
	 * @param firstName - The user's first name.
	 * @param lastName - The user's last name (optional).
	 * @returns A promise that resolves to the created user document, or an error if the email is already taken.
	 */
	async register(email: string, password: string, firstName: string, lastName?: string) {
		const existing = await this.userRepository.findOne({
			email: email.toLowerCase(),
		});
		if (existing?.isVerified) {
			return buildError(StatusCodes.CONFLICT, UserMessages.USER_ALREADY_EXISTS);
		}

		const otp = generateOtp();
		const otpHash = await hashPassword(otp);
		const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

		let user: UserDocument;
		if (existing) {
			// Unverified account — refresh OTP so they can retry
			user = (await this.userRepository.findOneAndUpdate(
				{ email: existing.email },
				{ otp: otpHash, otpExpiry },
			)) as UserDocument;
		} else {
			const hashed = await hashPassword(password);
			user = await this.userRepository.create({
				email: email.toLowerCase(),
				password: hashed,
				firstName,
				lastName,
				isVerified: false,
				otp: otpHash,
				otpExpiry,
			});
		}

		return { user, otp };
	}

	/**
	 * Validates a user's email and password credentials.
	 *
	 * @param email - The user's email address.
	 * @param password - The plain-text password to verify.
	 * @returns A promise that resolves to the user document if credentials are valid, or an error otherwise.
	 */
	async login(email: string, password: string) {
		const user = await this.userRepository.findOneWithPassword({
			email: email.toLowerCase(),
		});
		if (!user) {
			return buildError(StatusCodes.UNAUTHORIZED, UserMessages.INVALID_CREDENTIALS);
		}
		const valid = await comparePassword(password, user.password);
		if (!valid) {
			return buildError(StatusCodes.UNAUTHORIZED, UserMessages.INVALID_CREDENTIALS);
		}
		if (!user.isVerified) {
			return buildError(StatusCodes.FORBIDDEN, UserMessages.EMAIL_NOT_VERIFIED);
		}
		return user;
	}

	async resendOtp(email: string) {
		const user = await this.userRepository.findOne({ email: email.toLowerCase() });
		if (!user) {
			return buildError(StatusCodes.NOT_FOUND, UserMessages.USER_NOT_FOUND);
		}
		if (user.isVerified) {
			return buildError(StatusCodes.CONFLICT, UserMessages.ALREADY_VERIFIED);
		}
		// Rate-limit: block if last OTP was issued less than 60 seconds ago
		if (user.otpExpiry && user.otpExpiry.getTime() - Date.now() > 9 * 60 * 1000) {
			return buildError(StatusCodes.TOO_MANY_REQUESTS, UserMessages.OTP_RESEND_TOO_SOON);
		}

		const otp = generateOtp();
		const otpHash = await hashPassword(otp);
		const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

		const updated = (await this.userRepository.findOneAndUpdate(
			{ email: user.email },
			{ otp: otpHash, otpExpiry },
		)) as UserDocument;

		return { user: updated, otp };
	}

	async verifyOtp(email: string, otp: string) {
		const user = await this.userRepository.findOne({
			email: email.toLowerCase(),
		});
		if (!user) {
			return buildError(StatusCodes.NOT_FOUND, UserMessages.USER_NOT_FOUND);
		}
		if (user.isVerified) {
			return buildError(StatusCodes.CONFLICT, UserMessages.ALREADY_VERIFIED);
		}
		if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
			return buildError(StatusCodes.BAD_REQUEST, UserMessages.OTP_INVALID);
		}
		const valid = await comparePassword(otp, user.otp);
		if (!valid) {
			return buildError(StatusCodes.BAD_REQUEST, UserMessages.OTP_INVALID);
		}
		return (await this.userRepository.findOneAndUpdate(
			{ email: user.email },
			{ isVerified: true, $unset: { otp: 1, otpExpiry: 1 } },
		)) as UserDocument;
	}

	/**
	 * Creates an access token for a given user.
	 *
	 * @param sub - The JWT subject payload.
	 * @returns A promise that resolves to the signed JWT access token.
	 */
	async createAccessToken(sub: JwtSubject): Promise<string> {
		const payload: JwtPayload = { sub };
		return JWTServices.generateToken(payload, {
			expiresIn: ACCESS_TOKEN_EXPIRY,
			algorithm: "HS256",
		});
	}

	/**
	 * Creates a refresh token for a given user.
	 *
	 * @param sub - The JWT subject payload.
	 * @returns A promise that resolves to the signed JWT refresh token.
	 */
	async createRefreshToken(sub: JwtSubject): Promise<string> {
		const payload: JwtPayload = { sub };
		return JWTServices.generateToken(payload, {
			expiresIn: REFRESH_TOKEN_EXPIRY,
			algorithm: "HS256",
		});
	}

	/**
	 * Finds a logged-in user by their ID.
	 *
	 * @param id - The MongoDB ObjectId string of the user.
	 * @returns A promise that resolves to the user document if found, otherwise null.
	 */
	async findLoggedInUser(id: Types.ObjectId): Promise<UserDocument | null> {
		return await this.userRepository.findById(id);
	}
}

export default AuthService;
