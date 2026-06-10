import { Router } from "express";
import ControllerManager from "../../controllers";
import { authMiddleware, requireRole } from "../../lib/middleware/auth";
import { validate } from "../../lib/middleware/validate";
import { CreatePackageSchema, UpdatePackageSchema } from "../../lib/validators/package.schema";

class PackageRouter extends ControllerManager {
	public router: Router;

	constructor() {
		super();
		this.router = Router();
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get("/", super.packageController.list);
		this.router.post(
			"/",
			authMiddleware,
			requireRole("admin"),
			validate(CreatePackageSchema),
			super.packageController.create,
		);
		this.router.put(
			"/:id",
			authMiddleware,
			requireRole("admin"),
			validate(UpdatePackageSchema),
			super.packageController.update,
		);
		this.router.delete(
			"/:id",
			authMiddleware,
			requireRole("admin"),
			super.packageController.deactivate,
		);
	}
}

export default new PackageRouter().router;
