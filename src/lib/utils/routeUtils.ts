import fs from "node:fs";
import path from "node:path";
import type { Router } from "express";

/**
 * Dynamically loads and mounts routes from a specified directory.
 * @param router - The main router to which routes will be mounted.
 * @param routesDirectory - The directory containing route files.
 */
export const loadRoutes = (router: Router, routesDirectory: string) => {
	fs.readdirSync(routesDirectory).forEach((file) => {
		if (/\.(ts|js)$/.test(file) && !/^index\.(ts|js)$/.test(file)) {
			const route = require(path.join(routesDirectory, file)).default;
			const routePath = `/${file.replace(/\.(ts|js)$/, "")}`;
			router.use(routePath, route);
		}
	});
};
