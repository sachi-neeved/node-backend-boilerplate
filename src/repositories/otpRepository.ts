import { type OtpData, type OtpDocument, OtpModel, type OtpPurpose } from "../models/Otp";
import BaseRepository from "./baseRepository";

class OtpRepository extends BaseRepository<OtpDocument, OtpData> {
	constructor() {
		super(OtpModel);
	}

	findLatest(email: string, purpose: OtpPurpose): Promise<OtpDocument | null> {
		return this.model.findOne({ email, purpose, used: false }).sort({ createdAt: -1 });
	}

	markUsed(id: OtpDocument["_id"]): Promise<OtpDocument | null> {
		return this.model.findByIdAndUpdate(id, { used: true }, { new: true });
	}

	invalidateAll(email: string, purpose: OtpPurpose): Promise<void> {
		return this.model
			.updateMany({ email, purpose, used: false }, { used: true })
			.then(() => undefined);
	}
}

export default OtpRepository;
