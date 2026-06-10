import type { Request, Response } from "express";
import { Types } from "mongoose";
import asyncHandler from "../lib/handlers/asyncHandler";
import PackageMessages from "../lib/messages/package";
import buildResponse from "../lib/utils/buildResponse";
import type { CreatePackageInput, UpdatePackageInput } from "../lib/validators/package.schema";
import ServiceManager from "../services";

class PackageController extends ServiceManager {
	/**
	 * @desc    List all active packages
	 * @route   GET /packages
	 * @access  Public
	 */
	public list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
		const packages = await this.packageServices.listActive();
		buildResponse(res, { message: PackageMessages.PACKAGES_FETCHED, packages });
	});

	/**
	 * @desc    Create a new package
	 * @route   POST /packages
	 * @access  Admin
	 */
	public create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const data = req.body as CreatePackageInput;
		const pkg = await this.packageServices.create(data);
		buildResponse(res, { message: PackageMessages.PACKAGE_CREATED, package: pkg }, 201);
	});

	/**
	 * @desc    Update a package
	 * @route   PUT /packages/:id
	 * @access  Admin
	 */
	public update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		const data = req.body as UpdatePackageInput;
		const pkg = await this.packageServices.update(new Types.ObjectId(id as string), data);
		buildResponse(res, { message: PackageMessages.PACKAGE_UPDATED, package: pkg });
	});

	/**
	 * @desc    Deactivate (soft-delete) a package
	 * @route   DELETE /packages/:id
	 * @access  Admin
	 */
	public deactivate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
		const { id } = req.params;
		await this.packageServices.deactivate(new Types.ObjectId(id as string));
		buildResponse(res, { message: PackageMessages.PACKAGE_UPDATED });
	});
}

export default PackageController;
