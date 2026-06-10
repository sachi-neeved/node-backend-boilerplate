import mongoose, { type Document, Schema, type Types } from "mongoose";

/**
 * Represents the data structure for a user document.
 *
 * @property {string} email - Unique email address (stored lowercase).
 * @property {string} password - bcrypt-hashed password (select: false by default).
 * @property {string} firstName - The user's first name.
 * @property {string} [lastName] - The user's last name (optional).
 * @property {string} [phone] - The user's phone number (optional).
 * @property {Types.ObjectId} roleId - Reference to the user's Role document.
 * @property {boolean} isVerified - Whether the user's email has been verified via OTP.
 * @property {boolean} isActive - Whether the account is enabled.
 */
export interface UserData {
	email: string;
	password: string;
	firstName: string;
	lastName?: string;
	phone?: string;
	roleId: Types.ObjectId;
	isVerified: boolean;
	isActive: boolean;
}

export type UserDocument = Document<Types.ObjectId> & UserData;

const UserSchema = new Schema<UserDocument>(
	{
		email: { type: String, required: true, unique: true, lowercase: true },
		password: { type: String, required: true, select: false },
		firstName: { type: String, required: true },
		lastName: { type: String },
		phone: { type: String },
		roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
		isVerified: { type: Boolean, default: false },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

export const UserModel = mongoose.model<UserDocument>("User", UserSchema);
