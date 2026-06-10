import mongoose, { type Document, Schema, type Types } from "mongoose";

export type TransactionType = "credit" | "debit";
export type TransactionStatus = "pending" | "completed" | "failed";
export type TransactionReferenceType = "subscription" | "topup" | "refund" | "court_fee";

export interface WalletTransactionData {
	walletId: Types.ObjectId;
	userId: Types.ObjectId;
	type: TransactionType;
	amountInPaise: number;
	description: string;
	referenceType?: TransactionReferenceType;
	referenceId?: string;
	balanceBefore: number;
	balanceAfter: number;
	status: TransactionStatus;
}

export type WalletTransactionDocument = Document<Types.ObjectId> & WalletTransactionData;

const WalletTransactionSchema = new Schema<WalletTransactionDocument>(
	{
		walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		type: { type: String, enum: ["credit", "debit"], required: true },
		amountInPaise: { type: Number, required: true, min: 1 },
		description: { type: String, required: true },
		referenceType: {
			type: String,
			enum: ["subscription", "topup", "refund", "court_fee"],
		},
		referenceId: { type: String },
		balanceBefore: { type: Number, required: true },
		balanceAfter: { type: Number, required: true },
		status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
	},
	{ timestamps: true },
);

WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

export const WalletTransactionModel = mongoose.model<WalletTransactionDocument>(
	"WalletTransaction",
	WalletTransactionSchema,
);
