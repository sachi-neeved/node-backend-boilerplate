import jwt from "jsonwebtoken";
import type { JwtPayload } from "../@types";
import { JWT_SECRET_KEY } from "../lib//constants";
import buildError from "../lib//utils/buildError";
import { StatusCodes } from "../lib//utils/statusCodes";

/**
 * Class for JWT services.
 */
class JWTServices {
	/**
	 * Generates a JWT token.
	 * @param {JwtPayload} payload - The payload to be included in the token.
	 * @returns {string} The generated JWT token.
	 */
	static generateToken(payload: JwtPayload, options?: jwt.SignOptions): string {
		if (!payload) return buildError(StatusCodes.BAD_GATEWAY, "Payload cannot be empty");
		return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: "600s", algorithm: "HS256", ...options });
	}

	/**
	 * Verifies a JWT token.
	 * @param {string} token - The JWT token to be verified.
	 * @returns {JwtPayload | null} The decoded payload if the token is valid, otherwise null.
	 */
	static verifyToken(token: string): JwtPayload | null {
		try {
			const decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
			return decoded;
		} catch {
			buildError(StatusCodes.UNAUTHORIZED, "Invalid token");
			return null;
		}
	}
}

export default JWTServices;
