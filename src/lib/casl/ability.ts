import { AbilityBuilder, createMongoAbility, type MongoAbility } from "@casl/ability";
import type { RoleName } from "../../models/Role";

export const ACTIONS = ["manage", "read", "write", "delete"] as const;

// Scoped to what this boilerplate actually has — extend as real features land.
export const SUBJECTS = ["all", "users", "roles", "profile"] as const;

export type Actions = (typeof ACTIONS)[number];
export type Subjects = (typeof SUBJECTS)[number];
export type AppAbility = MongoAbility<[Actions, Subjects]>;

type CanFn = AbilityBuilder<AppAbility>["can"];

/**
 * Hardcoded ability rules for system roles.
 * These are the canonical definitions — DB permissions for system roles are ignored
 * so their access cannot be escalated by editing the database.
 *
 * Deliberately minimal starting point for "user" — there's nothing in this
 * boilerplate yet beyond auth/profile to grant — extend as real features land.
 */
const SYSTEM_ROLE_ABILITIES: Record<RoleName, (can: CanFn) => void> = {
	user: (can) => {
		can("read", "profile");
		can("write", "profile");
	},
	admin: (can) => {
		can("manage", "all");
	},
};

/** Returns true if `role` is a system role with a hardcoded ability definition. */
export function isSystemRole(role: string): role is RoleName {
	return role in SYSTEM_ROLE_ABILITIES;
}

/**
 * Builds an AppAbility for a user.
 * - System roles: uses the hardcoded definition above (DB permissions ignored).
 * - Custom roles: parses the "action:subject" permission strings from the JWT.
 */
export function defineAbilityForRole(role: string, permissions: string[]): AppAbility {
	const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

	if (isSystemRole(role)) {
		SYSTEM_ROLE_ABILITIES[role](can);
	} else {
		for (const permission of permissions) {
			const colonIndex = permission.indexOf(":");
			if (colonIndex > -1) {
				const action = permission.slice(0, colonIndex) as Actions;
				const subject = permission.slice(colonIndex + 1) as Subjects;
				can(action, subject);
			}
		}
	}

	return build();
}

/** Returns true if `permission` is a valid "action:subject" string. */
export function isValidPermission(permission: string): boolean {
	const colonIndex = permission.indexOf(":");
	if (colonIndex === -1) return false;
	const action = permission.slice(0, colonIndex);
	const subject = permission.slice(colonIndex + 1);
	return (
		(ACTIONS as readonly string[]).includes(action) &&
		(SUBJECTS as readonly string[]).includes(subject)
	);
}

/** Returns every valid "action:subject" combination. */
export function allPermissions(): string[] {
	const perms: string[] = [];
	for (const action of ACTIONS) {
		for (const subject of SUBJECTS) {
			perms.push(`${action}:${subject}`);
		}
	}
	return perms;
}
