import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface PackageData {
	name: string;
	slug: string;
	description: string;
	priceInPaise: number;
	currency: string;
	durationDays: number;
	features: string[];
	maxCases?: number;
	isActive: boolean;
}

export type PackageDocument = Document<Types.ObjectId> & PackageData;

const PackageSchema = new Schema<PackageDocument>(
	{
		name: { type: String, required: true },
		slug: { type: String, required: true, unique: true, lowercase: true },
		description: { type: String, required: true },
		priceInPaise: { type: Number, required: true, min: 0 },
		currency: { type: String, default: "INR" },
		durationDays: { type: Number, required: true, min: 1 },
		features: [{ type: String }],
		maxCases: { type: Number },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

export const PackageModel = mongoose.model<PackageDocument>("Package", PackageSchema);
