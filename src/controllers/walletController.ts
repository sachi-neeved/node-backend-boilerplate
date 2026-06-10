import type { Request, Response } from "express";
import { Types } from "mongoose";
import asyncHandler from "../lib/handlers/asyncHandler";
import WalletMessages from "../lib/messages/wallet";
import { getUser } from "../lib/middleware/auth";
import buildError from "../lib/utils/buildError";
import buildResponse from "../lib/utils/buildResponse";
import { StatusCodes } from "../lib/utils/statusCodes";
import type { TopupInput } from "../lib/validators/wallet.schema";
import ServiceManager from "../services";

class WalletController extends ServiceManager {
	/**
	 * @desc    Get current user's wallet balance and recent transactions
	 * @route   GET /wallet
	 * @access  Private
	 */
	public get = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const reqUser = getUser(res);
		if (!reqUser?.id) return buildError(StatusCodes.UNAUTHORIZED, "Unauthorized");

		const limit = Math.min(Number(req.query.limit) || 20, 100);
		const skip = Number(req.query.skip) || 0;

		const wallet = await this.walletServices.getOrCreate(reqUser.id);
		const transactions = await this.walletServices.getTransactions(reqUser.id, limit, skip);
		buildResponse(res, { wallet, transactions });
	});

	/**
	 * @desc    Top up a user's wallet (admin only)
	 * @route   POST /wallet/topup
	 * @access  Admin
	 */
	public topup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { userId, amountInPaise, description } = req.body as TopupInput;
		const wallet = await this.walletServices.topup(
			new Types.ObjectId(userId),
			amountInPaise,
			description,
		);
		buildResponse(res, { message: WalletMessages.TOPUP_SUCCESS, wallet });
	});
}

export default WalletController;
