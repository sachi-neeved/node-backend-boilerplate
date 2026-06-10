import {
	type SubscriptionData,
	type SubscriptionDocument,
	SubscriptionModel,
	type SubscriptionStatus,
} from "../models/Subscription";
import BaseRepository from "./baseRepository";

class SubscriptionRepository extends BaseRepository<SubscriptionDocument, SubscriptionData> {
	constructor() {
		super(SubscriptionModel);
	}

	findActiveByUser(userId: SubscriptionData["userId"]): Promise<SubscriptionDocument | null> {
		return this.model.findOne({ userId, status: "active" }).populate("packageId");
	}

	findAllByUser(userId: SubscriptionData["userId"]): Promise<SubscriptionDocument[]> {
		return this.model.find({ userId }).populate("packageId").sort({ createdAt: -1 });
	}

	expireSubscriptions(): Promise<{ modifiedCount: number }> {
		return this.model.updateMany(
			{ status: "active" as SubscriptionStatus, endDate: { $lte: new Date() } },
			{ status: "expired" as SubscriptionStatus },
		);
	}
}

export default SubscriptionRepository;
