import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
	LoginSchema,
	RegisterSchema,
	ResendOtpSchema,
	VerifyOtpSchema,
} from "../../../validators/user.schema";

const UserResponseSchema = z.object({
	_id: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d0" }),
	email: z.email().openapi({ example: "user@example.com" }),
	firstName: z.string().openapi({ example: "John" }),
	lastName: z.string().optional().openapi({ example: "Doe" }),
	createdAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
	updatedAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
});

const MessageResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	response: z.object({
		message: z.string().openapi({ example: "Verification code sent to your email" }),
	}),
});

const UserResponseWrappedSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	response: z.object({ user: UserResponseSchema }),
});

const ErrorResponseSchema = z.object({
	success: z.boolean().openapi({ example: false }),
	message: z.string().openapi({ example: "Error message" }),
	moreInfo: z.string().openapi({ example: "No additional info found." }),
});

export default function registerPaths(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "post",
		path: "/auth/register",
		tags: ["Auth"],
		summary: "Register a new user",
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: RegisterSchema.shape.body } },
			},
		},
		responses: {
			200: {
				description: "OTP sent to email",
				content: { "application/json": { schema: MessageResponseSchema } },
			},
			400: {
				description: "Validation error",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			409: {
				description: "Email already in use",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/auth/verify-otp",
		tags: ["Auth"],
		summary: "Verify OTP to activate account",
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: VerifyOtpSchema.shape.body } },
			},
		},
		responses: {
			200: {
				description: "OTP verified — account activated",
				content: { "application/json": { schema: UserResponseWrappedSchema } },
			},
			400: {
				description: "Validation error or OTP expired",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			401: {
				description: "Invalid OTP",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/auth/resend-otp",
		tags: ["Auth"],
		summary: "Resend OTP verification code",
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: ResendOtpSchema.shape.body } },
			},
		},
		responses: {
			200: {
				description: "OTP resent successfully",
				content: { "application/json": { schema: MessageResponseSchema } },
			},
			400: {
				description: "Validation error",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			404: {
				description: "User not found",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			409: {
				description: "Email already verified",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			429: {
				description: "Too many requests — wait before resending",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/auth/login",
		tags: ["Auth"],
		summary: "Login with email and password",
		description: "Sets `accessToken` and `refreshToken` as HTTP-only cookies on success.",
		request: {
			body: { required: true, content: { "application/json": { schema: LoginSchema.shape.body } } },
		},
		responses: {
			200: {
				description: "Login successful — tokens set as cookies",
				content: { "application/json": { schema: UserResponseWrappedSchema } },
			},
			400: {
				description: "Validation error",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			401: {
				description: "Invalid credentials",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			403: {
				description: "Email not verified",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/auth/me",
		tags: ["Auth"],
		summary: "Get the currently authenticated user",
		security: [{ BearerAuth: [] }],
		responses: {
			200: {
				description: "Authenticated user data",
				content: { "application/json": { schema: UserResponseWrappedSchema } },
			},
			401: {
				description: "Missing or invalid token",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			404: {
				description: "User not found",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});
}
