import type { RequestHandler, Response } from "express";
import type { JwtSubject } from "../../@types";
import { CookieName } from "../../config/cookie";
import type { RoleName } from "../../models/Role";
import JWTServices from "../../services/jwtServices";
import { handleError } from "../handlers/handleError";
import buildError from "../utils/buildError";
import { StatusCodes } from "../utils/statusCodes";

/**
 * Sets the authenticated user in the specified Response object.
 * @param res - Response object.
 * @param user - The JWT subject (authenticated user data).
 */
function setUser(res: Response, user: JwtSubject): void {
	res.locals.user = user;
}

/**
 * Extracts the authenticated user from the Response object.
 * @param res - Response object.
 * @returns The user stored in the Response object. Returns undefined if the client is not authorized.
 */
export function getUser(res: Response): JwtSubject | undefined {
	if (res.locals.user?.id) {
		return res.locals.user as JwtSubject;
	}
	buildError(StatusCodes.UNAUTHORIZED, "Unauthorized");
	return undefined;
}

/**
 * Middleware factory that restricts access to users with the specified roles.
 * Must be used after authMiddleware so that res.locals.user is populated.
 */
export const requireRole =
	(...roles: RoleName[]): RequestHandler =>
	(_, res, next) => {
		const user = res.locals.user as JwtSubject | undefined;
		if (!user?.role || !(roles as string[]).includes(user.role)) {
			return next(
				buildError(StatusCodes.FORBIDDEN, "You do not have permission to access this resource"),
			);
		}
		return next();
	};

/**
 * Middleware which authorizes the external client using a Bearer JWT token.
 * Expects the Authorization header in the format: Bearer <token>
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Function to call the next middleware.
 */
export const authMiddleware: RequestHandler = (req, res, next) => {
	try {
		const authHeader = req.header("authorization") || "";
		const [authType, headerToken = ""] = authHeader.split(" ");
		const bearerToken = authType?.toLowerCase() === "bearer" ? headerToken : "";
		const token =
			bearerToken || (req.cookies?.[CookieName.AccessToken] as string | undefined) || "";

		if (!token) {
			return next(
				buildError(StatusCodes.UNAUTHORIZED, "You are not authorized to access this resource"),
			);
		}

		const payload = JWTServices.verifyToken(token);
		if (!payload?.sub) {
			return next(buildError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
		}

		setUser(res, payload.sub);
		return next();
	} catch (error) {
		handleError(res, error);
	}
};
