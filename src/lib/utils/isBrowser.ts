/**
 * Checks if the given userAgent string indicates a browser environment.
 *
 * This function uses a regular expression to test the userAgent string against common browser identifiers.
 *
 * @param {string} userAgent - The userAgent string to check.
 * @returns {boolean} True if the userAgent indicates a browser environment, false otherwise.
 */
const isBrowser = (userAgent: string) => {
	return /Mozilla|Chrome|Safari|Firefox/i.test(userAgent);
};
export default isBrowser;
