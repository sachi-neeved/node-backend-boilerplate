import AuthService from "./authServices";
import JWTServices from "./jwtServices";
import MailService from "./mailService";
import PackageService from "./packageServices";
import RoleService from "./roleServices";
import SubscriptionService from "./subscriptionServices";
import WalletService from "./walletServices";

class ServiceManager {
	private authServicesInstance: AuthService | undefined;
	private jwtServicesInstance: JWTServices | undefined;
	private mailServiceInstance: MailService | undefined;
	private packageServicesInstance: PackageService | undefined;
	private roleServicesInstance: RoleService | undefined;
	private subscriptionServicesInstance: SubscriptionService | undefined;
	private walletServicesInstance: WalletService | undefined;

	protected get authServices() {
		this.authServicesInstance ??= new AuthService();
		return this.authServicesInstance;
	}

	protected get jwtServices() {
		this.jwtServicesInstance ??= new JWTServices();
		return this.jwtServicesInstance;
	}

	protected get mailService() {
		this.mailServiceInstance ??= new MailService();
		return this.mailServiceInstance;
	}

	protected get packageServices() {
		this.packageServicesInstance ??= new PackageService();
		return this.packageServicesInstance;
	}

	protected get roleServices() {
		this.roleServicesInstance ??= new RoleService();
		return this.roleServicesInstance;
	}

	protected get subscriptionServices() {
		this.subscriptionServicesInstance ??= new SubscriptionService();
		return this.subscriptionServicesInstance;
	}

	protected get walletServices() {
		this.walletServicesInstance ??= new WalletService();
		return this.walletServicesInstance;
	}
}

export default ServiceManager;
