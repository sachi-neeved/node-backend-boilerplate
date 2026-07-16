import { describe, expect, it } from "vitest";
import {
	ACTIONS,
	allPermissions,
	defineAbilityForRole,
	isSystemRole,
	isValidPermission,
	SUBJECTS,
} from "./ability";

describe("isSystemRole", () => {
	it("recognizes the two seeded system roles", () => {
		expect(isSystemRole("user")).toBe(true);
		expect(isSystemRole("admin")).toBe(true);
	});

	it("returns false for a custom role name", () => {
		expect(isSystemRole("editor")).toBe(false);
	});
});

describe("defineAbilityForRole — system roles", () => {
	it("grants user read/write on their own profile only", () => {
		const ability = defineAbilityForRole("user", []);

		expect(ability.can("read", "profile")).toBe(true);
		expect(ability.can("write", "profile")).toBe(true);
		expect(ability.can("manage", "users")).toBe(false);
		expect(ability.can("read", "roles")).toBe(false);
	});

	it("grants admin unrestricted access via manage:all", () => {
		const ability = defineAbilityForRole("admin", []);

		expect(ability.can("manage", "all")).toBe(true);
		expect(ability.can("read", "users")).toBe(true);
		expect(ability.can("delete", "roles")).toBe(true);
	});

	it("ignores DB permissions entirely for system roles — hardcoded rules win", () => {
		// A tampered/escalated permissions array on a system role must have no effect.
		const ability = defineAbilityForRole("user", ["manage:all"]);

		expect(ability.can("manage", "all")).toBe(false);
		expect(ability.can("read", "profile")).toBe(true);
	});
});

describe("defineAbilityForRole — custom roles", () => {
	it("grants exactly the parsed action:subject permissions", () => {
		const ability = defineAbilityForRole("editor", ["read:users", "write:roles"]);

		expect(ability.can("read", "users")).toBe(true);
		expect(ability.can("write", "roles")).toBe(true);
		expect(ability.can("delete", "users")).toBe(false);
		expect(ability.can("read", "profile")).toBe(false);
	});

	it("grants nothing when the custom role has no permissions", () => {
		const ability = defineAbilityForRole("editor", []);

		expect(ability.can("read", "profile")).toBe(false);
	});

	it("silently skips malformed permission strings instead of throwing", () => {
		const ability = defineAbilityForRole("editor", ["not-a-permission", "read:users"]);

		expect(ability.can("read", "users")).toBe(true);
	});
});

describe("isValidPermission", () => {
	it("accepts every real action:subject combination", () => {
		for (const action of ACTIONS) {
			for (const subject of SUBJECTS) {
				expect(isValidPermission(`${action}:${subject}`)).toBe(true);
			}
		}
	});

	it("rejects unknown actions, unknown subjects, and malformed strings", () => {
		expect(isValidPermission("delete:everything")).toBe(false);
		expect(isValidPermission("fly:profile")).toBe(false);
		expect(isValidPermission("no-colon-here")).toBe(false);
		expect(isValidPermission("")).toBe(false);
	});
});

describe("allPermissions", () => {
	it("enumerates every action:subject pair and only valid ones", () => {
		const perms = allPermissions();

		expect(perms).toHaveLength(ACTIONS.length * SUBJECTS.length);
		expect(new Set(perms).size).toBe(perms.length); // no duplicates
		for (const perm of perms) {
			expect(isValidPermission(perm)).toBe(true);
		}
	});
});
