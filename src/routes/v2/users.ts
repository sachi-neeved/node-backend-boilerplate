import { Router } from "express";
import ControllerManager from "../../controllers";
import { authMiddleware } from "../../lib/middleware/auth";

// v2 breaking change: GET /me returns { name: { first, last } } instead of { firstName, lastName }
class UserV2Router extends ControllerManager {
	public router: Router;

	constructor() {
		super();
		this.router = Router();
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get("/me", authMiddleware, super.userController.getUser);
	}
}

export default new UserV2Router().router;
