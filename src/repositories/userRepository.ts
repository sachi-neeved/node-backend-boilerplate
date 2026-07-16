import type { QueryFilter, Types } from "mongoose";
import { type UserData, type UserDocument, UserModel } from "../models";
import BaseRepository from "./baseRepository";

/**
 * UserRepository extends BaseRepository to provide CRUD operations specific to the User model.
 */
class UserRepository extends BaseRepository<UserDocument, UserData> {
	constructor() {
		super(UserModel);
	}

	/** Populates `roleId` — needed anywhere the caller has to read the role's name/permissions. */
	findOneWithPassword(filter: QueryFilter<UserDocument>): Promise<UserDocument | null> {
		return this.model.findOne(filter).select("+password").populate("roleId");
	}

	findByIdWithRole(_id: Types.ObjectId): Promise<UserDocument | null> {
		return this.model.findById(_id).populate("roleId");
	}
}

export default UserRepository;
