import type { Application } from "express";
import v1Router from "./v1";
import v2Router from "./v2";

// Static imports instead of a runtime fs.readdirSync + require() scan — the dynamic
// version resolved fine under ts-node but not under Vite/Vitest's module loader (or
// any other bundler), since it can't statically analyze a runtime-computed require path.
const inItRouters = (app: Application) => {
	app.use("/api/v1", v1Router);
	app.use("/api/v2", v2Router);
};

export default inItRouters;
