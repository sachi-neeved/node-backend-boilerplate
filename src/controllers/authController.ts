import type { Request, Response } from "express";
import { CookieName, cookieConfig } from "../config/cookie";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../lib/constants";
import asyncHandler from "../lib/handlers/asyncHandler";
import UserMessages from "../lib/messages/user";
import { getUser } from "../lib/middleware/auth";
import buildError from "../lib/utils/buildError";
import buildResponse from "../lib/utils/buildResponse";
import { StatusCodes } from "../lib/utils/statusCodes";
import type {
	LoginInput,
	RegisterInput,
	ResendOtpInput,
	VerifyOtpInput,
} from "../lib/validators/user.schema";
import ServiceManager from "../services";

class AuthController extends ServiceManager {
	/**
	 * @desc    Register a new user
	 * @route   POST /auth/register
	 * @access  Public
	 * @returns A promise that resolves to void.
	 */
	public register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { email, password, firstName, lastName } = req.body as RegisterInput;
		const result = await this.authServices.register(email, password, firstName, lastName);
		if (result && "otp" in result) {
			await this.mailService.sendOtpEmail(result.user.email, result.user.firstName, result.otp);
			buildResponse(res, { message: UserMessages.OTP_SENT });
		}
	});

	/**
	 * @desc    Verify OTP for user registration
	 * @route   POST /auth/verify-otp
	 * @access  Public
	 * @returns A promise that resolves to void.
	 */
	public verifyOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { email, otp } = req.body as VerifyOtpInput;
		const user = await this.authServices.verifyOtp(email, otp);
		if (user) {
			await this.mailService.sendWelcomeEmail(user.email, user.firstName);
		}
		buildResponse(res, { user });
	});
	/**
	 * @desc    Resend OTP for user registration
	 * @route   POST /auth/resend-otp
	 * @access  Public
	 * @returns A promise that resolves to void.
	 */
	public resendOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { email } = req.body as ResendOtpInput;
		const result = await this.authServices.resendOtp(email);
		if (result && "otp" in result) {
			await this.mailService.sendOtpEmail(result.user.email, result.user.firstName, result.otp);
			buildResponse(res, { message: UserMessages.OTP_RESENT });
		}
	});

	/**
	 * @desc    Get the currently authenticated user
	 * @route   GET /auth/me
	 * @access  Private
	 */
	public getProfile = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
		const reqUser = getUser(res);
		if (!reqUser?.id) {
			return buildError(StatusCodes.UNAUTHORIZED, UserMessages.USER_NOT_FOUND);
		}
		const user = await this.authServices.findLoggedInUser(reqUser.id);
		if (!user) {
			return buildError(StatusCodes.NOT_FOUND, UserMessages.USER_NOT_FOUND);
		}
		buildResponse(res, {
			user,
		});
	});

	/**
	 * @desc    Authenticate a user with email and password
	 * @route   POST /auth/login
	 * @access  Public
	 * @returns A promise that resolves to void.
	 */
	public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { email, password } = req.body as LoginInput;
		const user = await this.authServices.login(email, password);
		if (user && "_id" in user) {
			const accessToken = await this.authServices.createAccessToken({
				id: user._id,
				email: user.email,
				firstName: user.firstName,
			});
			const refreshToken = await this.authServices.createRefreshToken({
				id: user._id,
				email: user.email,
				firstName: user.firstName,
			});
			res.cookie(CookieName.AccessToken, accessToken, {
				...cookieConfig,
				maxAge: ACCESS_TOKEN_EXPIRY * 1000,
			});
			res.cookie(CookieName.RefreshToken, refreshToken, {
				...cookieConfig,
				maxAge: REFRESH_TOKEN_EXPIRY * 1000,
			});
			buildResponse(res, { user });
		}
	});
}

export default AuthController;
