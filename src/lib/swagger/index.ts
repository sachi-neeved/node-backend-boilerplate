import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
// Must load before the paths/*.ts imports below: registry.ts calls extendZodWithOpenApi(z),
// which patches Zod's prototype with `.openapi()` — the paths files call that at module-load
// time, so this import's side effect has to run first. Keep this line first even though it's
// alphabetically after "./paths/..." — organizeImports is disabled for this file in
// biome.json's overrides specifically so an auto-fix can't reorder it and break this.
import { v1Registry, v2Registry } from "./registry";
import registerV1AuthPaths from "./paths/v1/auth.paths";
import registerV1UsersPaths from "./paths/v1/users.paths";
import registerV2UsersPaths from "./paths/v2/users.paths";

// Static imports instead of a runtime fs.readdirSync + require() scan — the dynamic
// version resolved fine under ts-node but not under Vite/Vitest's module loader (or
// any other bundler), since it can't statically analyze a runtime-computed require path.
registerV1AuthPaths(v1Registry);
registerV1UsersPaths(v1Registry);
registerV2UsersPaths(v2Registry);

const baseInfo = {
	title: "Court Record API",
	description: "REST API for the Court Record backend",
};

export function generateV1Doc() {
	const generator = new OpenApiGeneratorV31(v1Registry.definitions);
	return generator.generateDocument({
		openapi: "3.1.0",
		info: { ...baseInfo, version: "1.0.0" },
		servers: [{ url: "/api/v1", description: "Version 1" }],
		tags: [{ name: "v1", description: "Version 1 endpoints" }],
	});
}

export function generateV2Doc() {
	const generator = new OpenApiGeneratorV31(v2Registry.definitions);
	return generator.generateDocument({
		openapi: "3.1.0",
		info: { ...baseInfo, version: "2.0.0" },
		servers: [{ url: "/api/v2", description: "Version 2" }],
		tags: [{ name: "v2", description: "Version 2 endpoints" }],
	});
}
