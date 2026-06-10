import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface WalletData {
	userId: Types.ObjectId;
	balanceInPaise: number;
	currency: string;
}

export type WalletDocument = Document<Types.ObjectId> & WalletData;

const WalletSchema = new Schema<WalletDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
		balanceInPaise: { type: Number, default: 0, min: 0 },
		currency: { type: String, default: "INR" },
	},
	{ timestamps: true },
);

export const WalletModel = mongoose.model<WalletDocument>("Wallet", WalletSchema);
