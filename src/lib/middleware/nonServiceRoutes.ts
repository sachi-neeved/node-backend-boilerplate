import { render } from "@react-email/render";
import { type Application, type Request, type Response, Router } from "express";
import { createElement } from "react";
import HomePage from "@/views/pages/HomePage";
import NotFoundPage from "@/views/pages/NotFoundPage";
import buildError from "../utils/buildError";
import buildResponse from "../utils/buildResponse";
import isBrowser from "../utils/isBrowser";
import { StatusCodes } from "../utils/statusCodes";

const nonServiceRoutes = Router();

/**
 * Handles health check routes by sending a 200 OK response.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
nonServiceRoutes.get("/health", (_req, res) => {
	res.status(200).send("OK");
});

/**
 * Handles home routes by sending a home html or json response.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
nonServiceRoutes.get("/", async (req: Request, res: Response) => {
	const userAgent = req.get("User-Agent") || "";
	if (isBrowser(userAgent)) {
		const html = `<!DOCTYPE html>${await render(createElement(HomePage))}`;
		res.type("html").send(html);
	} else {
		buildResponse(res, {
			server: "Backend Home",
			message: "The backend service is connected and running!",
		});
	}
});

/**
 * Handles all unmatched routes by sending a 404 error response.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
nonServiceRoutes.use("/{*path}", async (req, res) => {
	const userAgent = req.get("User-Agent") || "";
	if (isBrowser(userAgent)) {
		const html = `<!DOCTYPE html>${await render(createElement(NotFoundPage))}`;
		res.status(404).type("html").send(html);
	} else {
		buildError(StatusCodes.NOT_FOUND, "URL_NOT_FOUND");
	}
});

const inItNonServiceRoutes = (app: Application) => {
	app.use(nonServiceRoutes);
};

export default inItNonServiceRoutes;
