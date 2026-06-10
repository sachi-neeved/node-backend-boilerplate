import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { CreatePackageSchema, UpdatePackageSchema } from "../../../validators/package.schema";

const PackageSchema = z.object({
	_id: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d0" }),
	name: z.string().openapi({ example: "Professional" }),
	slug: z.string().openapi({ example: "professional" }),
	description: z.string().openapi({ example: "For practising lawyers" }),
	priceInPaise: z.number().openapi({ example: 99900 }),
	currency: z.string().openapi({ example: "INR" }),
	durationDays: z.number().openapi({ example: 30 }),
	features: z.array(z.string()).openapi({ example: ["Unlimited cases", "Priority support"] }),
	maxCases: z.number().optional().openapi({ example: 50 }),
	isActive: z.boolean().openapi({ example: true }),
	createdAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
	updatedAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
});

const PackagesListResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	response: z.object({ packages: z.array(PackageSchema) }),
});

const PackageResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
	response: z.object({ package: PackageSchema }),
});

const ErrorResponseSchema = z.object({
	success: z.boolean().openapi({ example: false }),
	message: z.string().openapi({ example: "Error message" }),
});

export default function registerPaths(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "get",
		path: "/packages",
		tags: ["Packages"],
		summary: "List all active packages",
		responses: {
			200: {
				description: "List of active packages",
				content: { "application/json": { schema: PackagesListResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/packages",
		tags: ["Packages"],
		summary: "Create a package (admin only)",
		security: [{ BearerAuth: [] }],
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: CreatePackageSchema.shape.body } },
			},
		},
		responses: {
			201: {
				description: "Package created",
				content: { "application/json": { schema: PackageResponseSchema } },
			},
			400: {
				description: "Validation error",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			403: {
				description: "Forbidden — admin only",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			409: {
				description: "Slug already exists",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "put",
		path: "/packages/{id}",
		tags: ["Packages"],
		summary: "Update a package (admin only)",
		security: [{ BearerAuth: [] }],
		request: {
			params: UpdatePackageSchema.shape.params,
			body: {
				required: true,
				content: { "application/json": { schema: UpdatePackageSchema.shape.body } },
			},
		},
		responses: {
			200: {
				description: "Package updated",
				content: { "application/json": { schema: PackageResponseSchema } },
			},
			400: {
				description: "Validation error",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			403: {
				description: "Forbidden — admin only",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			404: {
				description: "Package not found",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/packages/{id}",
		tags: ["Packages"],
		summary: "Deactivate a package (admin only)",
		security: [{ BearerAuth: [] }],
		request: {
			params: z.object({ id: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d0" }) }),
		},
		responses: {
			200: {
				description: "Package deactivated",
				content: { "application/json": { schema: z.object({ success: z.literal(true) }) } },
			},
			403: {
				description: "Forbidden — admin only",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			404: {
				description: "Package not found",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});
}
