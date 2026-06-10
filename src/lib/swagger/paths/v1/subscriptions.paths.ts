import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { SubscribeSchema } from "../../../validators/subscription.schema";

const SubscriptionSchema = z.object({
	_id: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d0" }),
	userId: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d1" }),
	packageId: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d2" }),
	status: z
		.enum(["active", "expired", "cancelled", "pending_payment"])
		.openapi({ example: "active" }),
	startDate: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
	endDate: z.string().openapi({ example: "2024-02-01T00:00:00.000Z" }),
	amountPaid: z.number().openapi({ example: 99900 }),
	currency: z.string().openapi({ example: "INR" }),
	createdAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
});

const SubscriptionResponseSchema = z.object({
	success: z.literal(true),
	response: z.object({ subscription: SubscriptionSchema }),
});

const SubscriptionsListResponseSchema = z.object({
	success: z.literal(true),
	response: z.object({ subscriptions: z.array(SubscriptionSchema) }),
});

const ErrorResponseSchema = z.object({
	success: z.literal(false),
	message: z.string().openapi({ example: "Error message" }),
});

const auth = { security: [{ BearerAuth: [] }] };

export default function registerPaths(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "post",
		path: "/subscriptions",
		tags: ["Subscriptions"],
		summary: "Subscribe to a package",
		description: "Deducts the package price from the user's wallet.",
		...auth,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: SubscribeSchema.shape.body } },
			},
		},
		responses: {
			201: {
				description: "Subscribed successfully",
				content: { "application/json": { schema: SubscriptionResponseSchema } },
			},
			400: {
				description: "Package inactive",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			402: {
				description: "Insufficient wallet balance",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			404: {
				description: "Package not found",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			409: {
				description: "Already subscribed",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/subscriptions",
		tags: ["Subscriptions"],
		summary: "Get all subscriptions for the current user",
		...auth,
		responses: {
			200: {
				description: "All subscriptions",
				content: { "application/json": { schema: SubscriptionsListResponseSchema } },
			},
			401: {
				description: "Unauthorized",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/subscriptions/me",
		tags: ["Subscriptions"],
		summary: "Get the current active subscription",
		...auth,
		responses: {
			200: {
				description: "Active subscription or null",
				content: { "application/json": { schema: SubscriptionResponseSchema } },
			},
			401: {
				description: "Unauthorized",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/subscriptions/me",
		tags: ["Subscriptions"],
		summary: "Cancel the current active subscription",
		...auth,
		responses: {
			200: {
				description: "Subscription cancelled",
				content: { "application/json": { schema: z.object({ success: z.literal(true) }) } },
			},
			401: {
				description: "Unauthorized",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			404: {
				description: "No active subscription",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});
}
