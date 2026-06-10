import { z } from "zod";

export const CreatePackageSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Name is required"),
		slug: z
			.string()
			.min(1, "Slug is required")
			.regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
		description: z.string().min(1, "Description is required"),
		priceInPaise: z.number().int().min(0, "Price must be non-negative"),
		currency: z.string().default("INR"),
		durationDays: z.number().int().min(1, "Duration must be at least 1 day"),
		features: z.array(z.string()).default([]),
		maxCases: z.number().int().min(1).optional(),
		isActive: z.boolean().default(true),
	}),
});

export const UpdatePackageSchema = z.object({
	body: z.object({
		name: z.string().min(1).optional(),
		description: z.string().min(1).optional(),
		priceInPaise: z.number().int().min(0).optional(),
		durationDays: z.number().int().min(1).optional(),
		features: z.array(z.string()).optional(),
		maxCases: z.number().int().min(1).optional(),
		isActive: z.boolean().optional(),
	}),
	params: z.object({
		id: z.string().min(1, "Package id is required"),
	}),
});

export type CreatePackageInput = z.infer<typeof CreatePackageSchema>["body"];
export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>["body"];
