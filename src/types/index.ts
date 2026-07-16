import type { Types } from "mongoose";

/**
 * Represents the subject of a JWT token.
 *
 * @property {string} id - The unique identifier of the subject (MongoDB ObjectId as string).
 * @property {string} email - The email address of the subject.
 * @property {string} firstName - The first name of the subject.
 * @property {string} role - The name of the subject's role.
 * @property {string[]} permissions - "action:subject" permission strings (only meaningful
 *   for custom roles — system roles' abilities are hardcoded, see lib/casl/ability.ts).
 */
export interface JwtSubject {
	id: Types.ObjectId;
	email: string;
	firstName: string;
	role: string;
	permissions: string[];
}

/**
 * Represents the payload of a JWT token.
 *
 * @property {(JwtSubject | undefined)} sub - The subject of the JWT token.
 * @property {(number | undefined)} exp - The expiration time of the JWT token.
 * @property {(number | undefined)} iat - The time at which the JWT token was issued.
 */
export type JwtPayload = {
	sub?: JwtSubject;
	exp?: number;
	iat?: number;
};

/**
 * Represents an error response.
 *
 * @property {(number | undefined)} code - The error code.
 * @property {(string | undefined)} message - The error message.
 * @property {(string | object | undefined)} moreInfo - Additional information about the error.
 */
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
