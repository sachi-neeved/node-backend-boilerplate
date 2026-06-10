import type {
	AnyKeys,
	AnyObject,
	Model,
	QueryFilter,
	QueryOptions,
	SaveOptions,
	Types,
	UpdateQuery,
} from "mongoose";

/**
 * BaseRepository is a generic class that provides basic CRUD operations for a given mongoose model.
 * It allows for finding all documents, finding documents by ID, and finding a single document by ID.
 *
 * @template T The type of the documents in the model.
 */
class BaseRepository<TDoc, TCreate = TDoc> {
	/**
	 * The mongoose model associated with this repository.
	 */
	constructor(public model: Model<TDoc>) {}

	/**
	 * Finds all documents in the model.
	 *
	 * @returns A promise that resolves to an array of documents.
	 */
	findAll(filter: QueryFilter<TDoc> = {}): Promise<TDoc[]> {
		return this.model.find(filter);
	}

	/**
	 * Finds documents by their ID.
	 *
	 * @param _id The ID of the document(s) to find.
	 * @returns A promise that resolves to an array of documents.
	 */
	findById(_id: Types.ObjectId): Promise<TDoc | null> {
		return this.model.findById(_id);
	}

	/**
	 * Finds a single document by its ID.
	 *
	 * @param _id The ID of the document to find.
	 * @returns A promise that resolves to the document if found, otherwise null.
	 */
	findOne(filter: QueryFilter<TDoc>): Promise<TDoc | null> {
		return this.model.findOne(filter);
	}

	/**
	 * Finds a single document by its ID and updates it.
	 *
	 * @param filter The filter to apply to the update operation.
	 * @param update The update to apply to the document.
	 * @param options The options to apply to the update operation.
	 * @returns A promise that resolves to the updated document if found, otherwise null.
	 */
	findOneAndUpdate(filter: QueryFilter<TDoc>, update: UpdateQuery<TDoc>, options?: QueryOptions) {
		return this.model.findOneAndUpdate(filter, update, options);
	}

	/**
	 * Finds a document by its ID and updates it.
	 *
	 * @param _id The ID of the document to find and update.
	 * @param update The update to apply to the document.
	 * @param options The options to apply to the update operation.
	 * @returns A promise that resolves to the updated document if found, otherwise null.
	 */
	findByIdAndUpdate(_id: Types.ObjectId, update: UpdateQuery<TDoc>, options?: QueryOptions) {
		return this.model.findByIdAndUpdate(_id, update, options);
	}

	/**
	 * Creates a new document in the model.
	 *
	 * @param doc The document to be created.
	 * @param options The options to apply to the creation operation.
	 * @returns A promise that resolves to the created document.
	 */
	create(doc: TCreate, options?: SaveOptions): Promise<TDoc> {
		const instance = new this.model(doc as unknown as AnyKeys<TDoc> & AnyObject);
		return instance.save(options) as unknown as Promise<TDoc>;
	}
}

export default BaseRepository;
