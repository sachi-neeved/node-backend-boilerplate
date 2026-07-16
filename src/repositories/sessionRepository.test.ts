import type { Types } from "mongoose";
import { describe, expect, it, vi } from "vitest";
import { SessionModel } from "../models/Session";
import SessionRepository from "./sessionRepository";

vi.mock("../models/Session", () => ({
	SessionModel: {
		findOne: vi.fn(),
		findOneAndUpdate: vi.fn(),
		updateMany: vi.fn(),
		find: vi.fn(),
	},
}));

const userId = "507f1f77bcf86cd799439011" as unknown as Types.ObjectId;

describe("SessionRepository.revokeAllForUser", () => {
	it("revokes every active session for the user and resolves to undefined", async () => {
		(SessionModel.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ acknowledged: true });
		const repository = new SessionRepository();

		const result = await repository.revokeAllForUser(userId);

		expect(SessionModel.updateMany).toHaveBeenCalledWith(
			{ userId, isRevoked: false },
			{ isRevoked: true },
		);
		expect(result).toBeUndefined();
	});
});

describe("SessionRepository.findActiveByUser", () => {
	it("queries for non-revoked, non-expired sessions sorted newest-first", async () => {
		const sessions = [{ _id: "s1" }, { _id: "s2" }];
		const sortMock = vi.fn().mockResolvedValue(sessions);
		(SessionModel.find as ReturnType<typeof vi.fn>).mockReturnValue({ sort: sortMock });
		const repository = new SessionRepository();

		const result = await repository.findActiveByUser(userId);

		expect(SessionModel.find).toHaveBeenCalledWith(
			expect.objectContaining({ userId, isRevoked: false, expiresAt: { $gt: expect.any(Date) } }),
		);
		expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
		expect(result).toBe(sessions);
	});
});
