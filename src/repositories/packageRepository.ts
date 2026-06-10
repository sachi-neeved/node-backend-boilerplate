import { type PackageData, type PackageDocument, PackageModel } from "../models/Package";
import BaseRepository from "./baseRepository";

class PackageRepository extends BaseRepository<PackageDocument, PackageData> {
	constructor() {
		super(PackageModel);
	}
}

export default PackageRepository;
