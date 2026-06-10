import toErrorMessage from "./toErrorMessage";

type TryCatchResult<T> = [data: T, error: null] | [data: null, error: string];

const tryCatch = async <T>(
	tryFn: () => Promise<T>,
	finallyFn?: () => void,
): Promise<TryCatchResult<T>> => {
	try {
		const data = await tryFn();
		return [data, null];
	} catch (err) {
		return [null, toErrorMessage(err)];
	} finally {
		finallyFn?.();
	}
};

export default tryCatch;
