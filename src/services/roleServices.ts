import RoleMessages from "../lib/messages/role";
import buildError from "../lib/utils/buildError";
import { StatusCodes } from "../lib/utils/statusCodes";
import type { RoleData, RoleDocument } from "../models/Role";
import RepositoryManager from "../repositories";

/**
 * RoleService manages role CRUD operations.
 * System roles (isSystem: true) are protected — they cannot be updated or deleted.
 */
class RoleService extends RepositoryManager {
	/**
	 * Returns all roles.
	 *
	 * @returns Array of all role documents.
	 */
	async listAll(): Promise<RoleDocument[]> {
		return this.roleRepository.findAll();
	}

	/**
	 * Finds a role by its MongoDB ObjectId.
	 *
	 * @param id - The role's ObjectId.
	 * @returns The role document, or throws 404.
	 */
	async findById(id: RoleDocument["_id"]): Promise<RoleDocument> {
		const role = await this.roleRepository.findById(id);
		if (!role) return buildError(StatusCodes.NOT_FOUND, RoleMessages.ROLE_NOT_FOUND);
		return role;
	}

	/**
	 * Creates a new custom role.
	 * Throws 409 if a role with the same name already exists.
	 *
	 * @param data - The role data to persist.
	 * @returns The created role document.
	 */
	async create(data: Omit<RoleData, "isSystem">): Promise<RoleDocument> {
		const existing = await this.roleRepository.findByName(data.name);
		if (existing) return buildError(StatusCodes.CONFLICT, RoleMessages.ROLE_NAME_EXISTS);
		return this.roleRepository.create({ ...data, isSystem: false });
	}

	/**
	 * Updates a role's display name or permissions.
	 * Throws 403 if the role has isSystem: true.
	 * The `name` field is immutable — changing it would break existing JWT subjects.
	 *
	 * @param id - The role's ObjectId.
	 * @param data - Partial update (displayName and/or permissions only).
	 * @returns The updated role document.
	 */
	async update(
		id: RoleDocument["_id"],
		data: Pick<Partial<RoleData>, "displayName" | "permissions">,
	): Promise<RoleDocument> {
		const role = await this.roleRepository.findById(id);
		if (!role) return buildError(StatusCodes.NOT_FOUND, RoleMessages.ROLE_NOT_FOUND);
		if (role.isSystem) return buildError(StatusCodes.FORBIDDEN, RoleMessages.ROLE_SYSTEM_PROTECTED);

		const updated = await this.roleRepository.findByIdAndUpdate(id, data, { new: true });
		return updated as RoleDocument;
	}

	/**
	 * Permanently deletes a custom role.
	 * Throws 403 if the role has isSystem: true.
	 *
	 * @param id - The role's ObjectId.
	 */
	async delete(id: RoleDocument["_id"]): Promise<void> {
		const role = await this.roleRepository.findById(id);
		if (!role) return buildError(StatusCodes.NOT_FOUND, RoleMessages.ROLE_NOT_FOUND);
		if (role.isSystem) return buildError(StatusCodes.FORBIDDEN, RoleMessages.ROLE_SYSTEM_PROTECTED);

		await this.roleRepository.model.findByIdAndDelete(id);
	}
}

export default RoleService;
