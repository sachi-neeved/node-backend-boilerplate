import mongoose, { type Document, Schema, type Types } from "mongoose";

export type OtpPurpose = "registration" | "password_reset";

export interface OtpData {
	email: string;
	otpHash: string;
	purpose: OtpPurpose;
	expiresAt: Date;
	used: boolean;
}

export type OtpDocument = Document<Types.ObjectId> & OtpData;

const OtpSchema = new Schema<OtpDocument>(
	{
		email: { type: String, required: true, lowercase: true },
		otpHash: { type: String, required: true },
		purpose: { type: String, enum: ["registration", "password_reset"], required: true },
		expiresAt: { type: Date, required: true },
		used: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

OtpSchema.index({ email: 1, purpose: 1 });
// Auto-delete expired documents after 1 hour
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export const OtpModel = mongoose.model<OtpDocument>("Otp", OtpSchema);
