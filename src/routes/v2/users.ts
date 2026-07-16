import { Router } from "express";
import UserController from "../../controllers/userController";
import { authMiddleware } from "../../lib/middleware/auth";

// v2 breaking change: GET /me returns { name: { first, last } } instead of { firstName, lastName }
class UserV2Router {
	public router: Router;
	private readonly userController: UserController = new UserController();

	constructor() {
		this.router = Router();
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get("/me", authMiddleware, this.userController.getUser);
	}
}

export default new UserV2Router().router;
