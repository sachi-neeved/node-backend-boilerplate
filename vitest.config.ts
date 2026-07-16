import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json-summary"],
			include: ["src/**/*.ts"],
			thresholds: {
				statements: 80,
				lines: 80,
			},
			exclude: [
				"src/**/*.test.ts",
				"src/types/**",
				"src/models/**", // schema declarations only, no logic to cover
				"src/lib/swagger/**", // OpenAPI doc metadata, no logic to cover
				"src/views/**", // React-email templates, not exercised by unit tests
				"src/config/db.ts", // Database connection setup, not logic to cover
				"src/lib/logger/**", // Logger configuration, not logic to cover
				"src/lib/middleware/nonServiceRoutes.ts", // Non-service routes middleware, not logic to cover
				"src/lib/middleware/swagger.ts", // Swagger middleware, not logic to cover
			],
		},
	},
});
