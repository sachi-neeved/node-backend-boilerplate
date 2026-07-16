import { type RoleData, type RoleDocument, RoleModel } from "../models/Role";
import BaseRepository from "./baseRepository";

class RoleRepository extends BaseRepository<RoleDocument, RoleData> {
	constructor() {
		super(RoleModel);
	}

	findByName(name: string): Promise<RoleDocument | null> {
		return this.model.findOne({ name });
	}
}

export default RoleRepository;
