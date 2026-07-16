import mongoose, { type Document, Schema, type Types } from "mongoose";

export type RoleName = "user" | "admin";

export interface RoleData {
	name: string;
	displayName: string;
	permissions: string[];
	isSystem: boolean;
}

export type RoleDocument = Document<Types.ObjectId> & RoleData;

const RoleSchema = new Schema<RoleDocument>(
	{
		name: { type: String, required: true, unique: true, lowercase: true },
		displayName: { type: String, required: true },
		permissions: [{ type: String }],
		isSystem: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

export const RoleModel = mongoose.model<RoleDocument>("Role", RoleSchema);

/**
 * Seed data for system roles. DB `permissions` are ignored for these roles at
 * authorization time — see lib/casl/ability.ts's SYSTEM_ROLE_ABILITIES, which
 * hardcodes their grants so access can't be escalated by editing the database.
 */
export const DEFAULT_ROLES: Pick<RoleData, "name" | "displayName" | "permissions" | "isSystem">[] =
	[
		{ name: "user", displayName: "User", permissions: [], isSystem: true },
		{ name: "admin", displayName: "Administrator", permissions: [], isSystem: true },
	];
