import type { Request, Response } from "express";
import { Types } from "mongoose";
import asyncHandler from "../lib/handlers/asyncHandler";
import RoleMessages from "../lib/messages/role";
import buildResponse from "../lib/utils/buildResponse";
import type { CreateRoleInput, UpdateRoleInput } from "../lib/validators/role.schema";
import ServiceManager from "../services";

/**
 * RoleController handles HTTP requests for role management.
 * All mutating endpoints are restricted to admin users via the requireRole middleware.
 */
class RoleController extends ServiceManager {
	/**
	 * @desc    List all roles
	 * @route   GET /roles
	 * @access  Private (admin)
	 */
	public list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
		const roles = await this.roleServices.listAll();
		buildResponse(res, { message: RoleMessages.ROLES_FETCHED, roles });
	});

	/**
	 * @desc    Create a custom role
	 * @route   POST /roles
	 * @access  Private (admin)
	 */
	public create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const data = req.body as CreateRoleInput;
		const role = await this.roleServices.create(data);
		buildResponse(res, { message: RoleMessages.ROLE_CREATED, role }, 201);
	});

	/**
	 * @desc    Update a role's displayName or permissions (system roles are protected)
	 * @route   PUT /roles/:id
	 * @access  Private (admin)
	 */
	public update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const data = req.body as UpdateRoleInput;
		const role = await this.roleServices.update(new Types.ObjectId(id as string), data);
		buildResponse(res, { message: RoleMessages.ROLE_UPDATED, role });
	});

	/**
	 * @desc    Delete a custom role (system roles are protected)
	 * @route   DELETE /roles/:id
	 * @access  Private (admin)
	 */
	public delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		await this.roleServices.delete(new Types.ObjectId(id as string));
		buildResponse(res, { message: RoleMessages.ROLE_DELETED });
	});
}

export default RoleController;
