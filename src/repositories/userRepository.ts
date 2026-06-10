import type { QueryFilter } from "mongoose";
import { type UserData, type UserDocument, UserModel } from "../models";
import BaseRepository from "./baseRepository";

/**
 * UserRepository extends BaseRepository to provide CRUD operations specific to the User model.
 */
class UserRepository extends BaseRepository<UserDocument, UserData> {
	constructor() {
		super(UserModel);
	}

	/**
	 * Finds a user by filter and includes the password field (normally excluded)
	 * and populates the roleId reference.
	 *
	 * @param filter - Mongoose query filter.
	 * @returns The user document with password and role, or null.
	 */
	findOneWithPassword(filter: QueryFilter<UserDocument>): Promise<UserDocument | null> {
		return this.model.findOne(filter).select("+password").populate("roleId");
	}

	/**
	 * Finds a user by ID and populates the roleId reference.
	 *
	 * @param id - The MongoDB ObjectId of the user.
	 * @returns The populated user document, or null.
	 */
	findByIdWithRole(id: UserDocument["_id"]): Promise<UserDocument | null> {
		return this.model.findById(id).populate("roleId");
	}
}

export default UserRepository;
