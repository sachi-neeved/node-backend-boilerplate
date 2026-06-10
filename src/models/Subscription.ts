import mongoose, { type Document, Schema, type Types } from "mongoose";

export type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending_payment";

export interface SubscriptionData {
	userId: Types.ObjectId;
	packageId: Types.ObjectId;
	status: SubscriptionStatus;
	startDate: Date;
	endDate: Date;
	amountPaid: number;
	currency: string;
	paymentReference?: string;
}

export type SubscriptionDocument = Document<Types.ObjectId> & SubscriptionData;

const SubscriptionSchema = new Schema<SubscriptionDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
		status: {
			type: String,
			enum: ["active", "expired", "cancelled", "pending_payment"],
			default: "pending_payment",
		},
		startDate: { type: Date, required: true },
		endDate: { type: Date, required: true },
		amountPaid: { type: Number, required: true, min: 0 },
		currency: { type: String, default: "INR" },
		paymentReference: { type: String },
	},
	{ timestamps: true },
);

SubscriptionSchema.index({ userId: 1, status: 1 });

export const SubscriptionModel = mongoose.model<SubscriptionDocument>(
	"Subscription",
	SubscriptionSchema,
);
