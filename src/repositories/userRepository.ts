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

	findOneWithPassword(filter: QueryFilter<UserDocument>): Promise<UserDocument | null> {
		return this.model.findOne(filter).select("+password");
	}
}

export default UserRepository;
