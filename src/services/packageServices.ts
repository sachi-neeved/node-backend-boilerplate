import PackageMessages from "../lib/messages/package";
import buildError from "../lib/utils/buildError";
import { StatusCodes } from "../lib/utils/statusCodes";
import type { PackageData, PackageDocument } from "../models/Package";
import RepositoryManager from "../repositories";

class PackageService extends RepositoryManager {
	async listActive(): Promise<PackageDocument[]> {
		return this.packageRepository.findAll({ isActive: true });
	}

	async findById(id: PackageDocument["_id"]): Promise<PackageDocument> {
		const pkg = await this.packageRepository.findById(id);
		if (!pkg) buildError(StatusCodes.NOT_FOUND, PackageMessages.PACKAGE_NOT_FOUND);
		return pkg as PackageDocument;
	}

	async create(data: PackageData): Promise<PackageDocument> {
		const existing = await this.packageRepository.findOne({ slug: data.slug });
		if (existing) buildError(StatusCodes.CONFLICT, PackageMessages.PACKAGE_SLUG_EXISTS);
		return this.packageRepository.create(data);
	}

	async update(id: PackageDocument["_id"], data: Partial<PackageData>): Promise<PackageDocument> {
		const pkg = await this.packageRepository.findByIdAndUpdate(id, data, { new: true });
		if (!pkg) buildError(StatusCodes.NOT_FOUND, PackageMessages.PACKAGE_NOT_FOUND);
		return pkg as PackageDocument;
	}

	async deactivate(id: PackageDocument["_id"]): Promise<PackageDocument> {
		return this.update(id, { isActive: false });
	}
}

export default PackageService;
