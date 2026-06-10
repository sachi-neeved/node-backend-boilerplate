import fs from "node:fs";
import path from "node:path";
import { type OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { v1Registry, v2Registry } from "./registry";

type PathsModule = (registry: OpenAPIRegistry) => void;
type VersionedRegistries = Record<string, OpenAPIRegistry>;

const registries: VersionedRegistries = { v1: v1Registry, v2: v2Registry };
const pathsDir = path.resolve(__dirname, "paths");

fs.readdirSync(pathsDir)
	.filter((entry) => {
		const fullPath = path.join(pathsDir, entry);
		return fs.statSync(fullPath).isDirectory() && registries[entry];
	})
	.forEach((version) => {
		const registry = registries[version];
		const versionDir = path.join(pathsDir, version);

		fs.readdirSync(versionDir)
			.filter((f) => /\.(ts|js)$/.test(f))
			.forEach((file) => {
				const register = require(path.join(versionDir, file)).default as PathsModule;
				register(registry);
			});
	});

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
