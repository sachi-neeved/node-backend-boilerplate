import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { TopupSchema } from "../../../validators/wallet.schema";

const WalletSchema = z.object({
	_id: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d0" }),
	userId: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d1" }),
	balanceInPaise: z.number().openapi({ example: 250000 }),
	currency: z.string().openapi({ example: "INR" }),
	updatedAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
});

const TransactionSchema = z.object({
	_id: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d3" }),
	type: z.enum(["credit", "debit"]).openapi({ example: "debit" }),
	amountInPaise: z.number().openapi({ example: 99900 }),
	description: z.string().openapi({ example: "Subscription: Professional" }),
	referenceType: z
		.enum(["subscription", "topup", "refund", "court_fee"])
		.optional()
		.openapi({ example: "subscription" }),
	balanceBefore: z.number().openapi({ example: 349900 }),
	balanceAfter: z.number().openapi({ example: 250000 }),
	status: z.enum(["pending", "completed", "failed"]).openapi({ example: "completed" }),
	createdAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
});

const WalletResponseSchema = z.object({
	success: z.literal(true),
	response: z.object({
		wallet: WalletSchema,
		transactions: z.array(TransactionSchema),
	}),
});

const TopupResponseSchema = z.object({
	success: z.literal(true),
	response: z.object({ wallet: WalletSchema }),
});

const ErrorResponseSchema = z.object({
	success: z.literal(false),
	message: z.string().openapi({ example: "Error message" }),
});

const auth = { security: [{ BearerAuth: [] }] };

export default function registerPaths(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "get",
		path: "/wallet",
		tags: ["Wallet"],
		summary: "Get wallet balance and recent transactions",
		description:
			"Wallet is created automatically on first access. Supports `?limit` and `?skip` for pagination (max limit 100).",
		...auth,
		request: {
			query: z.object({
				limit: z.string().optional().openapi({ example: "20" }),
				skip: z.string().optional().openapi({ example: "0" }),
			}),
		},
		responses: {
			200: {
				description: "Wallet and transactions",
				content: { "application/json": { schema: WalletResponseSchema } },
			},
			401: {
				description: "Unauthorized",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/wallet/topup",
		tags: ["Wallet"],
		summary: "Top up a user's wallet (admin only)",
		description: "Amount is specified in paise (100 paise = ₹1).",
		...auth,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: TopupSchema.shape.body } },
			},
		},
		responses: {
			200: {
				description: "Wallet topped up",
				content: { "application/json": { schema: TopupResponseSchema } },
			},
			400: {
				description: "Validation error",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			403: {
				description: "Forbidden — admin only",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});
}
