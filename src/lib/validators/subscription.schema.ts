import { z } from "zod";

export const SubscribeSchema = z.object({
	body: z.object({
		packageId: z.string().min(1, "Package id is required"),
	}),
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>["body"];
