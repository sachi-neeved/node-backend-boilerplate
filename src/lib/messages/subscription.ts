const SubscriptionMessages = {
	SUBSCRIBED: "Subscribed successfully",
	SUBSCRIPTION_FETCHED: "Subscription fetched successfully",
	SUBSCRIPTION_NOT_FOUND: "No active subscription found",
	SUBSCRIPTION_CANCELLED: "Subscription cancelled",
	ALREADY_SUBSCRIBED: "You already have an active subscription",
	INSUFFICIENT_BALANCE: "Insufficient wallet balance",
} as const;

export default SubscriptionMessages;
