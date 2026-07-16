import type { Application, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { generateV1Doc, generateV2Doc } from "../swagger";

/**
 * Mounts Swagger UI at /api-docs with a v1/v2 version dropdown.
 * Only active in development — skipped in production and in test runs, where its
 * dynamic `require()` of the path modules doesn't resolve under Vitest's loader.
 */
const initSwagger = (app: Application): void => {
	if (process.env.NODE_ENV !== "development") return;

	const v1Spec = generateV1Doc();
	const v2Spec = generateV2Doc();

	// Serve swagger-ui static assets
	app.use("/api-docs", swaggerUi.serve);

	// Serve each version's spec JSON so Swagger UI can fetch them
	app.get("/api-docs/v1/spec.json", (_req: Request, res: Response) => res.json(v1Spec));
	app.get("/api-docs/v2/spec.json", (_req: Request, res: Response) => res.json(v2Spec));

	// Serve the Swagger UI HTML with the version dropdown
	app.get(
		"/api-docs",
		swaggerUi.setup(null, {
			explorer: true,
			swaggerOptions: {
				dom_id: "#swagger-ui",
				urls: [
					{ url: "/api-docs/v1/spec.json", name: "v1" },
					{ url: "/api-docs/v2/spec.json", name: "v2" },
				],
				"urls.primaryName": "v1",
				withCredentials: true,
				persistAuthorization: true,
			},
		}),
	);
};

export default initSwagger;
