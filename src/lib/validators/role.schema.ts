import { z } from "zod";

export const CreateRoleSchema = z.object({
	body: z.object({
		name: z
			.string()
			.min(1, "Name is required")
			.regex(/^[a-z_]+$/, "Name must be lowercase letters and underscores only"),
		displayName: z.string().min(1, "Display name is required"),
		permissions: z.array(z.string()).default([]),
	}),
});

export const UpdateRoleSchema = z.object({
	body: z.object({
		displayName: z.string().min(1).optional(),
		permissions: z.array(z.string()).optional(),
	}),
	params: z.object({
		id: z.string().min(1, "Role id is required"),
	}),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>["body"];
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>["body"];
