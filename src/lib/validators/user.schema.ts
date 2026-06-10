import { z } from "zod";

export const RegisterSchema = z.object({
	body: z.object({
		email: z.email("Invalid email"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().optional(),
	}),
});

export const LoginSchema = z.object({
	body: z.object({
		email: z.email("Invalid email"),
		password: z.string().min(1, "Password is required"),
	}),
});

export const VerifyOtpSchema = z.object({
	body: z.object({
		email: z.email("Invalid email"),
		otp: z.string().length(6, "OTP must be 6 digits"),
	}),
});

export const ResendOtpSchema = z.object({
	body: z.object({
		email: z.email("Invalid email"),
	}),
});

export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
export type LoginInput = z.infer<typeof LoginSchema>["body"];
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>["body"];
export type ResendOtpInput = z.infer<typeof ResendOtpSchema>["body"];
