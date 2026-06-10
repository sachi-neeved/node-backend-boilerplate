import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface SessionData {
	userId: Types.ObjectId;
	tokenHash: string;
	userAgent?: string;
	ip?: string;
	expiresAt: Date;
	isRevoked: boolean;
}

export type SessionDocument = Document<Types.ObjectId> & SessionData;

const SessionSchema = new Schema<SessionDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		tokenHash: { type: String, required: true, unique: true },
		userAgent: { type: String },
		ip: { type: String },
		expiresAt: { type: Date, required: true },
		isRevoked: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

SessionSchema.index({ userId: 1 });
// Auto-delete expired sessions after 1 day
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export const SessionModel = mongoose.model<SessionDocument>("Session", SessionSchema);
