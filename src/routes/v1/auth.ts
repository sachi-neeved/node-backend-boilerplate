import { Router } from "express";
import { authMiddleware } from "@/lib/middleware/auth";
import ControllerManager from "../../controllers";
import { validate } from "../../lib/middleware/validate";
import {
	LoginSchema,
	RegisterSchema,
	ResendOtpSchema,
	VerifyOtpSchema,
} from "../../lib/validators/user.schema";

class AuthRouter extends ControllerManager {
	public router: Router;

	constructor() {
		super();
		this.router = Router();
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.post("/register", validate(RegisterSchema), super.authController.register);
		this.router.post("/verify-otp", validate(VerifyOtpSchema), super.authController.verifyOtp);
		this.router.post("/resend-otp", validate(ResendOtpSchema), super.authController.resendOtp);
		this.router.post("/login", validate(LoginSchema), super.authController.login);
		this.router.post("/refresh", super.authController.refresh);
		this.router.post("/logout", authMiddleware, super.authController.logout);
		this.router.get("/me", authMiddleware, super.authController.getProfile);
	}
}

export default new AuthRouter().router;
