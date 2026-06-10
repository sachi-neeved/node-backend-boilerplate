import OtpRepository from "./otpRepository";
import PackageRepository from "./packageRepository";
import RoleRepository from "./roleRepository";
import SessionRepository from "./sessionRepository";
import SubscriptionRepository from "./subscriptionRepository";
import UserRepository from "./userRepository";
import { WalletRepository, WalletTransactionRepository } from "./walletRepository";

class RepositoryManager {
	private _userRepositoryInstance: UserRepository | undefined;
	private _roleRepositoryInstance: RoleRepository | undefined;
	private _otpRepositoryInstance: OtpRepository | undefined;
	private _sessionRepositoryInstance: SessionRepository | undefined;
	private _packageRepositoryInstance: PackageRepository | undefined;
	private _subscriptionRepositoryInstance: SubscriptionRepository | undefined;
	private _walletRepositoryInstance: WalletRepository | undefined;
	private _walletTransactionRepositoryInstance: WalletTransactionRepository | undefined;

	protected get userRepository() {
		this._userRepositoryInstance ??= new UserRepository();
		return this._userRepositoryInstance;
	}

	protected get roleRepository() {
		this._roleRepositoryInstance ??= new RoleRepository();
		return this._roleRepositoryInstance;
	}

	protected get otpRepository() {
		this._otpRepositoryInstance ??= new OtpRepository();
		return this._otpRepositoryInstance;
	}

	protected get sessionRepository() {
		this._sessionRepositoryInstance ??= new SessionRepository();
		return this._sessionRepositoryInstance;
	}

	protected get packageRepository() {
		this._packageRepositoryInstance ??= new PackageRepository();
		return this._packageRepositoryInstance;
	}

	protected get subscriptionRepository() {
		this._subscriptionRepositoryInstance ??= new SubscriptionRepository();
		return this._subscriptionRepositoryInstance;
	}

	protected get walletRepository() {
		this._walletRepositoryInstance ??= new WalletRepository();
		return this._walletRepositoryInstance;
	}

	protected get walletTransactionRepository() {
		this._walletTransactionRepositoryInstance ??= new WalletTransactionRepository();
		return this._walletTransactionRepositoryInstance;
	}
}

export default RepositoryManager;
