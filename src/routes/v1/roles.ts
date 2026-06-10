import { Router } from "express";
import ControllerManager from "../../controllers";
import { authMiddleware, requireRole } from "../../lib/middleware/auth";
import { validate } from "../../lib/middleware/validate";
import { CreateRoleSchema, UpdateRoleSchema } from "../../lib/validators/role.schema";

class RoleRouter extends ControllerManager {
	public router: Router;

	constructor() {
		super();
		this.router = Router();
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get("/", authMiddleware, requireRole("admin"), super.roleController.list);
		this.router.post(
			"/",
			authMiddleware,
			requireRole("admin"),
			validate(CreateRoleSchema),
			super.roleController.create,
		);
		this.router.put(
			"/:id",
			authMiddleware,
			requireRole("admin"),
			validate(UpdateRoleSchema),
			super.roleController.update,
		);
		this.router.delete("/:id", authMiddleware, requireRole("admin"), super.roleController.delete);
	}
}

export default new RoleRouter().router;
