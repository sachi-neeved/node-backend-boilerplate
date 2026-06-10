import { z } from "zod";

export const TopupSchema = z.object({
	body: z.object({
		userId: z.string().min(1, "User id is required"),
		amountInPaise: z.number().int().min(1, "Amount must be at least 1 paise"),
		description: z.string().optional(),
	}),
});

export type TopupInput = z.infer<typeof TopupSchema>["body"];
