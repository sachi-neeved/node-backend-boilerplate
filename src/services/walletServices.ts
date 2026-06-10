import type { Types } from "mongoose";
import WalletMessages from "../lib/messages/wallet";
import buildError from "../lib/utils/buildError";
import { StatusCodes } from "../lib/utils/statusCodes";
import type { WalletDocument } from "../models/Wallet";
import type { WalletTransactionDocument } from "../models/WalletTransaction";
import RepositoryManager from "../repositories";

class WalletService extends RepositoryManager {
	async getOrCreate(userId: Types.ObjectId): Promise<WalletDocument> {
		return this.walletRepository.findOrCreate(userId);
	}

	async getTransactions(
		userId: Types.ObjectId,
		limit = 20,
		skip = 0,
	): Promise<WalletTransactionDocument[]> {
		const wallet = await this.walletRepository.findByUser(userId);
		if (!wallet) buildError(StatusCodes.NOT_FOUND, WalletMessages.WALLET_NOT_FOUND);
		return this.walletTransactionRepository.findByWallet(wallet!._id, limit, skip);
	}

	async topup(
		userId: Types.ObjectId,
		amountInPaise: number,
		description = "Wallet top-up",
	): Promise<WalletDocument> {
		const wallet = await this.walletRepository.findOrCreate(userId);
		const balanceBefore = wallet.balanceInPaise;
		const balanceAfter = balanceBefore + amountInPaise;

		const updated = (await this.walletRepository.findByIdAndUpdate(
			wallet._id,
			{ balanceInPaise: balanceAfter },
			{ new: true },
		)) as WalletDocument;

		await this.walletTransactionRepository.create({
			walletId: wallet._id,
			userId,
			type: "credit",
			amountInPaise,
			description,
			referenceType: "topup",
			balanceBefore,
			balanceAfter,
			status: "completed",
		});

		return updated;
	}
}

export default WalletService;
