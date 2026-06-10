import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

const UserResponseSchema = z.object({
	_id: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d0" }),
	email: z.email().openapi({ example: "user@example.com" }),
	firstName: z.string().openapi({ example: "John" }),
	lastName: z.string().optional().openapi({ example: "Doe" }),
	createdAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
	updatedAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
});

const ErrorResponseSchema = z.object({
	success: z.boolean().openapi({ example: false }),
	message: z.string().openapi({ example: "Error message" }),
	moreInfo: z.string().openapi({ example: "No additional info found." }),
});

export default function registerPaths(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "get",
		path: "/users/me",
		tags: ["Users"],
		summary: "Get the currently authenticated user",
		security: [{ BearerAuth: [] }],
		responses: {
			200: {
				description: "Authenticated user data",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean().openapi({ example: true }),
							response: UserResponseSchema,
						}),
					},
				},
			},
			401: {
				description: "Unauthorized",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});
}
