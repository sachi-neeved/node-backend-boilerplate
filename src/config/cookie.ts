import type { CookieOptions } from "express";
import { DOMAIN, NODE_ENV } from "../lib/constants";

const isProduction = NODE_ENV === "production";

export const cookieConfig: CookieOptions = {
	httpOnly: true,
	secure: isProduction,
	...(DOMAIN ? { domain: DOMAIN } : {}),
	sameSite: isProduction ? "none" : "lax",
};

const COOKIE_PREFIX = isProduction ? "__Secure-" : "";

export const CookieName = {
	AccessToken: `${COOKIE_PREFIX}access_token`,
	RefreshToken: `${COOKIE_PREFIX}refresh_token`,
} as const;
