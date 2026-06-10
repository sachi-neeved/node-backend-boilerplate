import { Router } from "express";
import ControllerManager from "../../controllers";
import { authMiddleware } from "../../lib/middleware/auth";
import { validate } from "../../lib/middleware/validate";
import { SubscribeSchema } from "../../lib/validators/subscription.schema";

class SubscriptionRouter extends ControllerManager {
	public router: Router;

	constructor() {
		super();
		this.router = Router();
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get("/", authMiddleware, super.subscriptionController.getAll);
		this.router.get("/me", authMiddleware, super.subscriptionController.getActive);
		this.router.post(
			"/",
			authMiddleware,
			validate(SubscribeSchema),
			super.subscriptionController.subscribe,
		);
		this.router.delete("/me", authMiddleware, super.subscriptionController.cancel);
	}
}

export default new SubscriptionRouter().router;
