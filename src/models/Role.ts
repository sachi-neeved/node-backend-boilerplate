import mongoose, { type Document, Schema, type Types } from "mongoose";

export type RoleName = "client" | "lawyer" | "admin";

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

export const DEFAULT_ROLES: Pick<RoleData, "name" | "displayName" | "permissions" | "isSystem">[] =
	[
		{
			name: "client",
			displayName: "Client",
			permissions: ["cases:read", "documents:read"],
			isSystem: true,
		},
		{
			name: "lawyer",
			displayName: "Lawyer",
			permissions: ["cases:read", "cases:write", "documents:read", "documents:write"],
			isSystem: true,
		},
		{
			name: "admin",
			displayName: "Administrator",
			permissions: ["*"],
			isSystem: true,
		},
	];
