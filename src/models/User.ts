import mongoose, { type Document, Schema, type Types } from "mongoose";

/**
 * Represents the data structure for a user document.
 *
 * @property {string} email - The unique email address of the user.
 * @property {string} password - The bcrypt-hashed password of the user.
 * @property {string} firstName - The first name of the user.
 * @property {string} [lastName] - The last name of the user (optional).
 */
export interface UserData {
	email: string;
	password: string;
	firstName: string;
	lastName?: string;
	isVerified: boolean;
	otp?: string;
	otpExpiry?: Date;
}

export type UserDocument = Document<Types.ObjectId> & UserData;

// Create UserSchema
const UserSchema = new Schema<UserDocument>(
	{
		email: { type: String, required: true, unique: true, lowercase: true },
		password: { type: String, required: true, select: false },
		firstName: { type: String, required: true },
		lastName: { type: String },
		isVerified: { type: Boolean, default: false },
		otp: { type: String },
		otpExpiry: { type: Date },
	},
	{
		timestamps: true,
	},
);

// Create UserModel
export const UserModel = mongoose.model<UserDocument>("User", UserSchema);
