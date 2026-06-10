import UserRepository from "./userRepository";

class RepositoryManager {
	private _userRepositoryInstance: UserRepository | undefined;

	protected get userRepository() {
		this._userRepositoryInstance ??= new UserRepository();
		return this._userRepositoryInstance;
	}
}

export default RepositoryManager;
