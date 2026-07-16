import type { FieldError } from "../../types";

export class AppError extends Error {
	code: number;
	errors?: FieldError[];
	moreInfo?: string | object;

	constructor(code: number, message: string, errors?: FieldError[]) {
		super(message);
		this.name = "AppError";
		this.code = code;
		this.errors = errors;
	}
}

const buildError = (code: number, message: string): never => {
	throw new AppError(code, message);
};

export default buildError;
