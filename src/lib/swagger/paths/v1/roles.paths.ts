import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { CreateRoleSchema, UpdateRoleSchema } from "../../../validators/role.schema";

const RoleSchema = z.object({
	_id: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d1" }),
	name: z.string().openapi({ example: "paralegal" }),
	displayName: z.string().openapi({ example: "Paralegal" }),
	permissions: z.array(z.string()).openapi({ example: ["cases:read", "documents:read"] }),
	isSystem: z.boolean().openapi({ example: false }),
	createdAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
	updatedAt: z.string().openapi({ example: "2024-01-01T00:00:00.000Z" }),
});

const RoleListResponseSchema = z.object({
	success: z.literal(true),
	response: z.object({ roles: z.array(RoleSchema) }),
});

const RoleResponseSchema = z.object({
	success: z.literal(true),
	response: z.object({ role: RoleSchema }),
});

const ErrorResponseSchema = z.object({
	success: z.literal(false),
	message: z.string().openapi({ example: "Error message" }),
});

const auth = { security: [{ BearerAuth: [] }] };

export default function registerPaths(registry: OpenAPIRegistry) {
	registry.registerPath({
		method: "get",
		path: "/roles",
		tags: ["Roles"],
		summary: "List all roles (admin only)",
		...auth,
		responses: {
			200: {
				description: "All roles including system and custom",
				content: { "application/json": { schema: RoleListResponseSchema } },
			},
			403: {
				description: "Forbidden — admin only",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "post",
		path: "/roles",
		tags: ["Roles"],
		summary: "Create a custom role (admin only)",
		description:
			"The `isSystem` flag is always set to `false` for created roles. System roles (client, lawyer, admin) are seeded automatically.",
		...auth,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: CreateRoleSchema.shape.body } },
			},
		},
		responses: {
			201: {
				description: "Role created",
				content: { "application/json": { schema: RoleResponseSchema } },
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
				description: "Role name already exists",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "put",
		path: "/roles/{id}",
		tags: ["Roles"],
		summary: "Update a role's displayName or permissions (admin only)",
		description:
			"System roles (isSystem: true) are protected and cannot be modified. The role `name` is immutable.",
		...auth,
		request: {
			params: UpdateRoleSchema.shape.params,
			body: {
				required: true,
				content: { "application/json": { schema: UpdateRoleSchema.shape.body } },
			},
		},
		responses: {
			200: {
				description: "Role updated",
				content: { "application/json": { schema: RoleResponseSchema } },
			},
			400: {
				description: "Validation error",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			403: {
				description: "Forbidden — admin only or system role",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			404: {
				description: "Role not found",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/roles/{id}",
		tags: ["Roles"],
		summary: "Delete a custom role (admin only)",
		description: "System roles (isSystem: true) cannot be deleted.",
		...auth,
		request: {
			params: z.object({ id: z.string().openapi({ example: "64b8f1a2c3d4e5f6a7b8c9d1" }) }),
		},
		responses: {
			200: {
				description: "Role deleted",
				content: { "application/json": { schema: z.object({ success: z.literal(true) }) } },
			},
			403: {
				description: "Forbidden — admin only or system role",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
			404: {
				description: "Role not found",
				content: { "application/json": { schema: ErrorResponseSchema } },
			},
		},
	});
}
