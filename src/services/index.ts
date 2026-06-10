import AuthService from "./authServices";
import JWTServices from "./jwtServices";
import MailService from "./mailService";

class ServiceManager {
	private authServicesInstance: AuthService | undefined;
	private jwtServicesInstance: JWTServices | undefined;
	private mailServiceInstance: MailService | undefined;

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
}

export default ServiceManager;
