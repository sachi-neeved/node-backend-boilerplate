import AuthController from "./authController";
import PackageController from "./packageController";
import RoleController from "./roleController";
import SubscriptionController from "./subscriptionController";
import UserController from "./userController";
import WalletController from "./walletController";

class ControllerManager {
	private userControllerInstance: UserController | undefined;
	private authControllerInstance: AuthController | undefined;
	private packageControllerInstance: PackageController | undefined;
	private roleControllerInstance: RoleController | undefined;
	private subscriptionControllerInstance: SubscriptionController | undefined;
	private walletControllerInstance: WalletController | undefined;

	protected get userController() {
		this.userControllerInstance ??= new UserController();
		return this.userControllerInstance;
	}

	protected get authController() {
		this.authControllerInstance ??= new AuthController();
		return this.authControllerInstance;
	}

	protected get packageController() {
		this.packageControllerInstance ??= new PackageController();
		return this.packageControllerInstance;
	}

	protected get roleController() {
		this.roleControllerInstance ??= new RoleController();
		return this.roleControllerInstance;
	}

	protected get subscriptionController() {
		this.subscriptionControllerInstance ??= new SubscriptionController();
		return this.subscriptionControllerInstance;
	}

	protected get walletController() {
		this.walletControllerInstance ??= new WalletController();
		return this.walletControllerInstance;
	}
}

export default ControllerManager;
