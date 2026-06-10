import type { Types } from "mongoose";
import { type WalletData, type WalletDocument, WalletModel } from "../models/Wallet";
import {
	type WalletTransactionData,
	type WalletTransactionDocument,
	WalletTransactionModel,
} from "../models/WalletTransaction";
import BaseRepository from "./baseRepository";

export class WalletRepository extends BaseRepository<WalletDocument, WalletData> {
	constructor() {
		super(WalletModel);
	}

	findByUser(userId: Types.ObjectId): Promise<WalletDocument | null> {
		return this.model.findOne({ userId });
	}

	findOrCreate(userId: Types.ObjectId): Promise<WalletDocument> {
		return this.model.findOneAndUpdate(
			{ userId },
			{ $setOnInsert: { userId, balanceInPaise: 0, currency: "INR" } },
			{ upsert: true, new: true },
		) as Promise<WalletDocument>;
	}
}

export class WalletTransactionRepository extends BaseRepository<
	WalletTransactionDocument,
	WalletTransactionData
> {
	constructor() {
		super(WalletTransactionModel);
	}

	findByWallet(
		walletId: Types.ObjectId,
		limit = 20,
		skip = 0,
	): Promise<WalletTransactionDocument[]> {
		return this.model.find({ walletId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
	}
}
