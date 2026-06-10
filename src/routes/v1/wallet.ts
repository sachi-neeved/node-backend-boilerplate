import { Router } from "express";
import ControllerManager from "../../controllers";
import { authMiddleware, requireRole } from "../../lib/middleware/auth";
import { validate } from "../../lib/middleware/validate";
import { TopupSchema } from "../../lib/validators/wallet.schema";

class WalletRouter extends ControllerManager {
	public router: Router;

	constructor() {
		super();
		this.router = Router();
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get("/", authMiddleware, super.walletController.get);
		this.router.post(
			"/topup",
			authMiddleware,
			requireRole("admin"),
			validate(TopupSchema),
			super.walletController.topup,
		);
	}
}

export default new WalletRouter().router;
