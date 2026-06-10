import type { Types } from "mongoose";
import { type SessionData, type SessionDocument, SessionModel } from "../models/Session";
import BaseRepository from "./baseRepository";

class SessionRepository extends BaseRepository<SessionDocument, SessionData> {
	constructor() {
		super(SessionModel);
	}

	findByTokenHash(tokenHash: string): Promise<SessionDocument | null> {
		return this.model.findOne({ tokenHash, isRevoked: false });
	}

	revokeByTokenHash(tokenHash: string): Promise<SessionDocument | null> {
		return this.model.findOneAndUpdate({ tokenHash }, { isRevoked: true }, { new: true });
	}

	revokeAllForUser(userId: Types.ObjectId): Promise<void> {
		return this.model
			.updateMany({ userId, isRevoked: false }, { isRevoked: true })
			.then(() => undefined);
	}

	findActiveByUser(userId: Types.ObjectId): Promise<SessionDocument[]> {
		return this.model
			.find({ userId, isRevoked: false, expiresAt: { $gt: new Date() } })
			.sort({ createdAt: -1 });
	}
}

export default SessionRepository;
