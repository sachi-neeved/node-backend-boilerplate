import AuthController from "./authController";
import UserController from "./userController";

class ControllerManager {
	private userControllerInstance: UserController | undefined;
	private authControllerInstance: AuthController | undefined;

	protected get userController() {
		this.userControllerInstance ??= new UserController();
		return this.userControllerInstance;
	}

	protected get authController() {
		this.authControllerInstance ??= new AuthController();
		return this.authControllerInstance;
	}
}

export default ControllerManager;
