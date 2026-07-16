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
 * Options for narrowing/shaping a find query without forcing every caller
 * to reach past the repository for `.select()`/`.sort()`/`.lean()`.
 */
interface FindOptions {
	select?: string | Record<string, 0 | 1>;
	sort?: string | Record<string, 1 | -1>;
	limit?: number;
	skip?: number;
	/** Returns plain objects instead of hydrated documents — no `.save()`/virtuals/methods on the result. */
	lean?: boolean;
}

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
	 * @param filter The filter to apply.
	 * @param options Optional select/sort/limit/skip/lean — all opt-in, unset behaves as before.
	 * @returns A promise that resolves to an array of documents.
	 */
	findAll(filter: QueryFilter<TDoc> = {}, options: FindOptions = {}): Promise<TDoc[]> {
		const { select, sort, limit, skip, lean } = options;
		let query = this.model.find(filter);
		if (select) query = query.select(select) as typeof query;
		if (sort) query = query.sort(sort) as typeof query;
		if (typeof skip === "number") query = query.skip(skip) as typeof query;
		if (typeof limit === "number") query = query.limit(limit) as typeof query;
		return (lean ? query.lean() : query) as unknown as Promise<TDoc[]>;
	}

	/**
	 * Finds documents by their ID.
	 *
	 * @param _id The ID of the document(s) to find.
	 * @param options Optional select/lean.
	 * @returns A promise that resolves to an array of documents.
	 */
	findById(_id: Types.ObjectId, options: FindOptions = {}): Promise<TDoc | null> {
		const { select, lean } = options;
		let query = this.model.findById(_id);
		if (select) query = query.select(select) as typeof query;
		return (lean ? query.lean() : query) as unknown as Promise<TDoc | null>;
	}

	/**
	 * Finds a single document by its ID.
	 *
	 * @param filter The filter to apply.
	 * @param options Optional select/lean.
	 * @returns A promise that resolves to the document if found, otherwise null.
	 */
	findOne(filter: QueryFilter<TDoc>, options: FindOptions = {}): Promise<TDoc | null> {
		const { select, lean } = options;
		let query = this.model.findOne(filter);
		if (select) query = query.select(select) as typeof query;
		return (lean ? query.lean() : query) as unknown as Promise<TDoc | null>;
	}

	/**
	 * Finds a single document by its ID and updates it.
	 *
	 * @param filter The filter to apply to the update operation.
	 * @param update The update to apply to the document.
	 * @param options The options to apply to the update operation. Defaults to `{ returnDocument: "after" }`.
	 * @returns A promise that resolves to the updated document if found, otherwise null.
	 */
	findOneAndUpdate(filter: QueryFilter<TDoc>, update: UpdateQuery<TDoc>, options?: QueryOptions) {
		return this.model.findOneAndUpdate(filter, update, { returnDocument: "after", ...options });
	}

	/**
	 * Finds a document by its ID and updates it.
	 *
	 * @param _id The ID of the document to find and update.
	 * @param update The update to apply to the document.
	 * @param options The options to apply to the update operation. Defaults to `{ returnDocument: "after" }`.
	 * @returns A promise that resolves to the updated document if found, otherwise null.
	 */
	findByIdAndUpdate(_id: Types.ObjectId, update: UpdateQuery<TDoc>, options?: QueryOptions) {
		return this.model.findByIdAndUpdate(_id, update, { returnDocument: "after", ...options });
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
