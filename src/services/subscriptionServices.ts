import type { Types } from "mongoose";
import PackageMessages from "../lib/messages/package";
import SubscriptionMessages from "../lib/messages/subscription";
import buildError from "../lib/utils/buildError";
import { StatusCodes } from "../lib/utils/statusCodes";
import type { SubscriptionDocument } from "../models/Subscription";
import RepositoryManager from "../repositories";

class SubscriptionService extends RepositoryManager {
	async subscribe(
		userId: Types.ObjectId,
		packageId: Types.ObjectId,
	): Promise<SubscriptionDocument> {
		const active = await this.subscriptionRepository.findActiveByUser(userId);
		if (active) return buildError(StatusCodes.CONFLICT, SubscriptionMessages.ALREADY_SUBSCRIBED);

		const pkg = await this.packageRepository.findById(packageId);
		if (!pkg) return buildError(StatusCodes.NOT_FOUND, PackageMessages.PACKAGE_NOT_FOUND);
		if (!pkg.isActive) return buildError(StatusCodes.BAD_REQUEST, PackageMessages.PACKAGE_INACTIVE);

		const wallet = await this.walletRepository.findOrCreate(userId);
		if (wallet.balanceInPaise < pkg.priceInPaise) {
			return buildError(StatusCodes.PAYMENT_REQUIRED, SubscriptionMessages.INSUFFICIENT_BALANCE);
		}

		const startDate = new Date();
		const endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + pkg.durationDays);

		// Deduct from wallet atomically before creating subscription
		const balanceBefore = wallet.balanceInPaise;
		const balanceAfter = balanceBefore - pkg.priceInPaise;

		await this.walletRepository.findByIdAndUpdate(
			wallet._id,
			{ balanceInPaise: balanceAfter },
			{ new: true },
		);

		await this.walletTransactionRepository.create({
			walletId: wallet._id,
			userId,
			type: "debit",
			amountInPaise: pkg.priceInPaise,
			description: `Subscription: ${pkg.name}`,
			referenceType: "subscription",
			referenceId: packageId.toString(),
			balanceBefore,
			balanceAfter,
			status: "completed",
		});

		return this.subscriptionRepository.create({
			userId,
			packageId,
			status: "active",
			startDate,
			endDate,
			amountPaid: pkg.priceInPaise,
			currency: pkg.currency,
		});
	}

	async getActive(userId: Types.ObjectId): Promise<SubscriptionDocument | null> {
		return this.subscriptionRepository.findActiveByUser(userId);
	}

	async getAll(userId: Types.ObjectId): Promise<SubscriptionDocument[]> {
		return this.subscriptionRepository.findAllByUser(userId);
	}

	async cancel(userId: Types.ObjectId): Promise<SubscriptionDocument> {
		const active = await this.subscriptionRepository.findActiveByUser(userId);
		if (!active)
			return buildError(StatusCodes.NOT_FOUND, SubscriptionMessages.SUBSCRIPTION_NOT_FOUND);

		return (await this.subscriptionRepository.findOneAndUpdate(
			{ _id: active._id },
			{ status: "cancelled" },
			{ new: true },
		)) as SubscriptionDocument;
	}
}

export default SubscriptionService;
