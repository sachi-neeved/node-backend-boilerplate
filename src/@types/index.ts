import type { Types } from "mongoose";

export interface JwtSubject {
	id: Types.ObjectId;
	email: string;
	firstName: string;
	role: string;
}

export type JwtPayload = {
	sub?: JwtSubject;
	exp?: number;
	iat?: number;
};

export interface FieldError {
	field: string;
	message: string;
}

export interface ErrorResponse {
	code?: number;
	message?: string;
	errors?: FieldError[];
	moreInfo?: string | object;
}
