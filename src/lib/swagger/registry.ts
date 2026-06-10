import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

function createRegistry() {
	const reg = new OpenAPIRegistry();
	reg.registerComponent("securitySchemes", "BearerAuth", {
		type: "http",
		scheme: "bearer",
		bearerFormat: "JWT",
	});
	return reg;
}

export const v1Registry = createRegistry();
export const v2Registry = createRegistry();
