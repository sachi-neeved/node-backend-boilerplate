import type { Request, Response } from "express";
import { Types } from "mongoose";
import asyncHandler from "../lib/handlers/asyncHandler";
import SubscriptionMessages from "../lib/messages/subscription";
import { getUser } from "../lib/middleware/auth";
import buildError from "../lib/utils/buildError";
import buildResponse from "../lib/utils/buildResponse";
import { StatusCodes } from "../lib/utils/statusCodes";
import type { SubscribeInput } from "../lib/validators/subscription.schema";
import ServiceManager from "../services";

class SubscriptionController extends ServiceManager {
	/**
	 * @desc    Subscribe to a package (deducted from wallet)
	 * @route   POST /subscriptions
	 * @access  Private
	 */
	public subscribe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const reqUser = getUser(res);
		if (!reqUser?.id) return buildError(StatusCodes.UNAUTHORIZED, "Unauthorized");
		const { packageId } = req.body as SubscribeInput;
		const subscription = await this.subscriptionServices.subscribe(
			reqUser.id,
			new Types.ObjectId(packageId),
		);
		buildResponse(res, { message: SubscriptionMessages.SUBSCRIBED, subscription }, 201);
	});

	/**
	 * @desc    Get current user's active subscription
	 * @route   GET /subscriptions/me
	 * @access  Private
	 */
	public getActive = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
		const reqUser = getUser(res);
		if (!reqUser?.id) return buildError(StatusCodes.UNAUTHORIZED, "Unauthorized");
		const subscription = await this.subscriptionServices.getActive(reqUser.id);
		buildResponse(res, { subscription });
	});

	/**
	 * @desc    Get all subscriptions for the current user
	 * @route   GET /subscriptions
	 * @access  Private
	 */
	public getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
		const reqUser = getUser(res);
		if (!reqUser?.id) return buildError(StatusCodes.UNAUTHORIZED, "Unauthorized");
		const subscriptions = await this.subscriptionServices.getAll(reqUser.id);
		buildResponse(res, { subscriptions });
	});

	/**
	 * @desc    Cancel current active subscription
	 * @route   DELETE /subscriptions/me
	 * @access  Private
	 */
	public cancel = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
		const reqUser = getUser(res);
		if (!reqUser?.id) return buildError(StatusCodes.UNAUTHORIZED, "Unauthorized");
		await this.subscriptionServices.cancel(reqUser.id);
		buildResponse(res, { message: SubscriptionMessages.SUBSCRIPTION_CANCELLED });
	});
}

export default SubscriptionController;
