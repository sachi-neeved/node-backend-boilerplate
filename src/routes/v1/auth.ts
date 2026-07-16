import { Router } from "express";
import { authMiddleware } from "@/lib/middleware/auth";
import AuthController from "../../controllers/authController";
import { validate } from "../../lib/middleware/validate";
import {
	LoginSchema,
	RegisterSchema,
	ResendOtpSchema,
	VerifyOtpSchema,
} from "../../lib/validators/user.schema";

class AuthRouter {
	public router: Router;
	private readonly authController: AuthController = new AuthController();

	constructor() {
		this.router = Router();
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.post("/register", validate(RegisterSchema), this.authController.register);
		this.router.post("/verify-otp", validate(VerifyOtpSchema), this.authController.verifyOtp);
		this.router.post("/resend-otp", validate(ResendOtpSchema), this.authController.resendOtp);
		this.router.post("/login", validate(LoginSchema), this.authController.login);
		this.router.get("/me", authMiddleware, this.authController.getProfile);
	}
}

export default new AuthRouter().router;
