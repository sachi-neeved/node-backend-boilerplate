import type { Request, Response } from "express";
import asyncHandler from "../lib/handlers/asyncHandler";
import UserMessages from "../lib/messages/user";
import { getUser } from "../lib/middleware/auth";
import buildError from "../lib/utils/buildError";
import buildResponse from "../lib/utils/buildResponse";
import { StatusCodes } from "../lib/utils/statusCodes";
import ServiceManager from "../services";

/**
 * UserController is a class that extends ServiceManager and is responsible for handling user-related operations.
 */
class UserController extends ServiceManager {
	/**
	 * @desc    Get the currently authenticated user
	 * @route   GET /user
	 * @access  Private
	 * @returns A promise that resolves to void.
	 */
	public getUser = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
		const reqUser = getUser(res);
		if (!reqUser?.id) {
			return buildError(StatusCodes.UNAUTHORIZED, UserMessages.USER_NOT_FOUND);
		}
		const user = await this.authServices.findLoggedInUser(reqUser.id);
		if (user) {
			buildResponse(res, user);
		} else {
			buildError(StatusCodes.NOT_FOUND, UserMessages.USER_NOT_FOUND);
		}
	});
}

export default UserController;
