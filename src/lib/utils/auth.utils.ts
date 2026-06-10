import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hashes a plain-text password using bcrypt.
 *
 * @param {string} password - The plain-text password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain-text password against a bcrypt hash.
 *
 * @param {string} plain - The plain-text password to verify.
 * @param {string} hashed - The hashed password to compare against.
 * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, otherwise false.
 */
export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
	return bcrypt.compare(plain, hashed);
}
