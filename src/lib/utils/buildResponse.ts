import type { Response } from "express";

/**
 * Builds and sends a successful response.
 *
 * This function constructs a response object with a success indicator and the provided response data.
 * It then sends this response back to the client using the Express Response object.
 *
 * @param {Response} res - The Express Response object used to send the response back to the client.
 * @param {Object} [response={}] - The response data to be sent back to the client. Defaults to an empty object if not provided.
 * @returns {void} This function does not return a value. It directly sends the response back to the client.
 */
const buildResponse = (res: Response, response: object = {}): void => {
	res.send({
		success: true,
		response,
	});
};

export default buildResponse;
